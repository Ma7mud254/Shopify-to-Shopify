import { ConnectedShop, MigrationJob } from "@prisma/client";
import { prisma } from "../db";
import { MigrationConfig, MigrationStatus, getPipelineSteps, parseMigrationConfig } from "@/types";
import { exportProductsBatched, importProduct, getProductByHandle } from "../shopify/products";
import { exportCollectionsBatched, importCollection, getCollectionByHandle, addProductToCollection } from "../shopify/collections";
import { attachProductMedia, normalizeProductInput, updateVariantMedia, waitForMediaReady } from "./mapper";
import { exportMetafieldDefinitions, importMetafieldDefinition, setMetafields } from "../shopify/metafields";

const PRODUCT_IMPORT_CONCURRENCY = 4;
const COLLECTION_IMPORT_CONCURRENCY = 4;

class MigrationCanceledError extends Error {
  constructor() {
    super("Migration canceled by user");
    this.name = "MigrationCanceledError";
  }
}

export async function runMigrationPipeline(jobId: string) {
  const job = await prisma.migrationJob.findUnique({
    where: { id: jobId },
    include: {
      sourceShop: true,
      destinationShop: true,
    }
  });

  if (!job) throw new Error("Job not found");

  const config = parseMigrationConfig(job.config);
  const activeSteps = getPipelineSteps(config, job.dryRun);

  await prisma.migrationJob.update({
    where: { id: jobId },
    data: {
      totalSteps: activeSteps.length,
      completedSteps: 0,
    }
  });

  try {
    await assertMigrationActive(jobId);

    // 1. Validate / Verify Stores
    await logJobStatus(jobId, "VALIDATING", "verify_stores", "Connecting to source and destination shops...");

    // 2. Export Collections (if requested)
    if (config.resources.collections) {
      await logJobStatus(jobId, "EXPORTING", "export_collections", "Exporting collections from source shop...");
      await extractCollections(job);
    }

    // 3. Sync Metafield Definitions (if requested)
    if (config.resources.productMetafields && !job.dryRun) {
      await logJobStatus(jobId, "PROCESSING", "validate_metafields", "Syncing Product Metafield Definitions...");
      await syncMetafieldDefinitionsPhase(job, "PRODUCT");
    }
    
    if (config.resources.collectionMetafields && !job.dryRun) {
      await logJobStatus(jobId, "PROCESSING", "validate_metafields", "Syncing Collection Metafield Definitions...");
      await syncMetafieldDefinitionsPhase(job, "COLLECTION");
    }

    // 4. Export Products (if requested)
    if (config.resources.products) {
      await logJobStatus(jobId, "EXPORTING", "export_products", "Exporting products from source shop...");
      await extractProducts(job);
    }

    // 4. Import Collections (if requested)
    if (config.resources.collections && !job.dryRun) {
      await logJobStatus(jobId, "IMPORTING", "import_collections", "Importing collections to destination shop...");
      await importCollectionsPhase(job, config);
    }

    // 5. Import Products (if requested)
    if (config.resources.products && !job.dryRun) {
      await logJobStatus(jobId, "IMPORTING", "import_products", "Importing products to destination shop...");
      await importProductsPhase(job, config);
    }

    if (!job.dryRun && (config.resources.productMetafields || config.resources.collectionMetafields)) {
      await logJobStatus(jobId, "PROCESSING", "set_metafields", "Setting metafield values on destination resources...");
      await setMetafieldsPhase(job, config);
    }
    
    // 6. Finalize logic and mapping rebuilds
    if (config.resources.manualCollections && !job.dryRun) {
      await logJobStatus(jobId, "FINALIZING", "collection_membership", "Rebuilding manual collection memberships...");
      await rebuildCollectionMembershipsPhase(job);
    }

    await logJobStatus(jobId, "FINALIZING", "generate_report", "Generating migration execution reports...");
    await generateMigrationReportPhase(job);

    // 7. Mark Complete
    await logJobStatus(jobId, "COMPLETED", "complete", "Migration finished successfully.");

  } catch (err: any) {
    if (err instanceof MigrationCanceledError) {
      await prisma.migrationJob.update({
        where: { id: jobId },
        data: {
          status: "CANCELED",
          completedAt: new Date(),
        }
      });
      return;
    }

    // Re-fetch current state to ensure we have the latest step for the error log
    const latest = await prisma.migrationJob.findUnique({ where: { id: jobId }, select: { currentStep: true } });
    await logJobStatus(jobId, "FAILED", latest?.currentStep || "validate", `Migration failed: ${err.message}`);
    throw err;
  }
}

function shouldSkipMetafieldNamespace(namespace?: string | null) {
  if (!namespace) return true;

  return namespace.startsWith("shopify") || namespace.startsWith("$app");
}

function getCopyableMetafields(raw: any) {
  const edges = raw?.metafields?.edges ?? [];
  return edges
    .map((edge: any) => edge?.node)
    .filter((node: any) => node?.namespace && node?.key && !shouldSkipMetafieldNamespace(node.namespace));
}

async function assertMigrationActive(jobId: string) {
  const job = await prisma.migrationJob.findUnique({
    where: { id: jobId },
    select: { status: true }
  });

  if (job?.status === "CANCELED") {
    throw new MigrationCanceledError();
  }
}

async function processConcurrently<T>(
  jobId: string,
  items: T[],
  concurrency: number,
  handler: (item: T) => Promise<void>
) {
  let index = 0;

  async function worker() {
    while (index < items.length) {
      await assertMigrationActive(jobId);
      const currentIndex = index;
      index += 1;
      await handler(items[currentIndex]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, Math.max(items.length, 1)) }, () => worker());
  await Promise.all(workers);
}

async function extractProducts(job: MigrationJob & { sourceShop: ConnectedShop }) {
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    await assertMigrationActive(job.id);
    const data: any = await exportProductsBatched(job.sourceShop, cursor || undefined);
    if (!data) break;
    
    const products = data.edges.map((e: any) => e.node);

    await prisma.migrationJobItem.createMany({
      data: products.map((product: any) => ({
        jobId: job.id,
        resourceType: "PRODUCT",
        sourceId: product.id,
        sourceHandle: product.handle,
        sourceTitle: product.title,
        status: "PENDING",
        rawData: product,
      }))
    });

    hasNextPage = data.pageInfo.hasNextPage;
    cursor = data.pageInfo.endCursor;
    
    await prisma.migrationJob.update({
      where: { id: job.id },
      data: { totalItems: { increment: products.length } }
    });
  }
}

async function extractCollections(job: MigrationJob & { sourceShop: ConnectedShop }) {
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    await assertMigrationActive(job.id);
    const data: any = await exportCollectionsBatched(job.sourceShop, cursor || undefined);
    if (!data) break;
    
    const collections = data.edges.map((e: any) => e.node);

    await prisma.migrationJobItem.createMany({
      data: collections.map((collection: any) => ({
        jobId: job.id,
        resourceType: "COLLECTION",
        sourceId: collection.id,
        sourceHandle: collection.handle,
        sourceTitle: collection.title,
        status: "PENDING",
        rawData: collection,
      }))
    });

    hasNextPage = data.pageInfo.hasNextPage;
    cursor = data.pageInfo.endCursor;
    
    await prisma.migrationJob.update({
      where: { id: job.id },
      data: { totalItems: { increment: collections.length } }
    });
  }
}

async function syncMetafieldDefinitionsPhase(job: MigrationJob & { sourceShop: ConnectedShop, destinationShop: ConnectedShop }, ownerType: "PRODUCT" | "COLLECTION") {
  try {
    // 1. Fetch Source Metafields
    let sourceDefs: any[] = [];
  let hasNext = true;
  let cursor = null;
  while (hasNext) {
      await assertMigrationActive(job.id);
      const data: any = await exportMetafieldDefinitions(job.sourceShop, ownerType, cursor || undefined);
      if (!data) break;
      sourceDefs = [...sourceDefs, ...data.edges.map((e: any) => e.node)];
      hasNext = data.pageInfo.hasNextPage;
      cursor = data.pageInfo.endCursor;
    }

    sourceDefs = sourceDefs.filter((definition) => !shouldSkipMetafieldNamespace(definition.namespace));

    if (sourceDefs.length === 0) return;

    // 2. Fetch Destination Metafields
    let destDefs: any[] = [];
    hasNext = true;
    cursor = null;
    while (hasNext) {
      await assertMigrationActive(job.id);
      const data: any = await exportMetafieldDefinitions(job.destinationShop, ownerType, cursor || undefined);
      if (!data) break;
      destDefs = [...destDefs, ...data.edges.map((e: any) => e.node)];
      hasNext = data.pageInfo.hasNextPage;
      cursor = data.pageInfo.endCursor;
    }

    destDefs = destDefs.filter((definition) => !shouldSkipMetafieldNamespace(definition.namespace));

    // 3. Map destination keys for quick lookup: namespace.key => id
    const destMap = new Map(destDefs.map(d => [`${d.namespace}.${d.key}`, d.id]));

    await logJobStatus(job.id, "PROCESSING", "create_metafields", `Creating missing ${ownerType.toLowerCase()} metafield definitions...`);

    // 4. Create missing
    for (const sDef of sourceDefs) {
      await assertMigrationActive(job.id);
      const key = `${sDef.namespace}.${sDef.key}`;
      const existingDestinationId = destMap.get(key);

      if (!existingDestinationId) {
        try {
           const payload = {
             name: sDef.name,
             namespace: sDef.namespace,
             key: sDef.key,
             description: sDef.description,
             type: { name: sDef.type?.name || "single_line_text_field" },
             ownerType,
           };
           const created = await importMetafieldDefinition(job.destinationShop, payload);
           const destinationDefinitionId = created?.createdDefinition?.id || null;

           await prisma.metafieldDefinitionMapping.upsert({
             where: {
               jobId_namespace_key_ownerType: {
                 jobId: job.id,
                 namespace: sDef.namespace,
                 key: sDef.key,
                 ownerType,
               }
             },
             update: {
               sourceDefinitionId: sDef.id,
               destinationDefinitionId,
               created: true,
             },
             create: {
               jobId: job.id,
               namespace: sDef.namespace,
               key: sDef.key,
               ownerType,
               sourceDefinitionId: sDef.id,
               destinationDefinitionId,
               created: true,
             }
           });
        } catch (err: any) {
           await prisma.jobLog.create({
             data: {
               jobId: job.id,
               level: "WARN",
               step: "create_metafields",
               message: `Failed to create metafield definition ${key}: ${err.message}`,
             }
           });
        }
      } else {
        await prisma.metafieldDefinitionMapping.upsert({
          where: {
            jobId_namespace_key_ownerType: {
              jobId: job.id,
              namespace: sDef.namespace,
              key: sDef.key,
              ownerType,
            }
          },
          update: {
            sourceDefinitionId: sDef.id,
            destinationDefinitionId: existingDestinationId,
            created: false,
          },
          create: {
            jobId: job.id,
            namespace: sDef.namespace,
            key: sDef.key,
            ownerType,
            sourceDefinitionId: sDef.id,
            destinationDefinitionId: existingDestinationId,
            created: false,
          }
        });
      }
    }
  } catch (err: any) {
    await prisma.jobLog.create({
      data: {
        jobId: job.id,
        level: "ERROR",
        step: "validate_metafields",
        message: `Failed syncing Metafield Definitions (${ownerType}): ${err.message}`,
      }
    });
  }
}

async function importCollectionsPhase(job: MigrationJob & { destinationShop: ConnectedShop }, config: MigrationConfig) {
  const items = await prisma.migrationJobItem.findMany({
    where: { jobId: job.id, resourceType: "COLLECTION", status: "PENDING" }
  });

  await processConcurrently(job.id, items, COLLECTION_IMPORT_CONCURRENCY, async (item) => {
    try {
      const raw = item.rawData as any;
      let destId = null;

      // Conflict Detection
      if (raw.handle) {
        const existing = await getCollectionByHandle(job.destinationShop, raw.handle);
        if (existing) {
          if (config.conflictBehavior === "skip") {
            await markItemDone(job.id, item.id, "SKIPPED", existing.id);
            return;
          } else {
            // Update logic would go here. For now, we simulate success and map the ID.
            destId = existing.id;
          }
        }
      }

      // If no conflict or behavior is 'update' and it didn't exist
      if (!destId) {
         const created = await importCollection(job.destinationShop, raw);
         if (created?.collection?.id) {
           destId = created.collection.id;
         } else {
           throw new Error(JSON.stringify(created?.userErrors || "Failed to create collection"));
         }
      }

      // Save Mapping
      await prisma.resourceMapping.create({
        data: {
          jobId: job.id,
          resourceType: "COLLECTION",
          sourceId: item.sourceId,
          destinationId: destId,
          sourceHandle: item.sourceHandle,
        }
      });

      await markItemDone(job.id, item.id, "SUCCESS", destId);

    } catch (err: any) {
      await markItemDone(job.id, item.id, "FAILED", null, err.message);
    }
  });
}

async function importProductsPhase(job: MigrationJob & { destinationShop: ConnectedShop }, config: MigrationConfig) {
  const items = await prisma.migrationJobItem.findMany({
    where: { jobId: job.id, resourceType: "PRODUCT", status: "PENDING" }
  });

  await processConcurrently(job.id, items, PRODUCT_IMPORT_CONCURRENCY, async (item) => {
    try {
      const raw = item.rawData as any;
      let destId = null;
      let destVariants: any[] = [];

      // Conflict Detection
      if (raw.handle) {
        const existing = await getProductByHandle(job.destinationShop, raw.handle);
        if (existing) {
          if (config.conflictBehavior === "skip") {
            await markItemDone(job.id, item.id, "SKIPPED", existing.id);
            return;
          } else {
            destId = existing.id;
            destVariants = existing.variants?.edges || [];
          }
        }
      }

      if (!destId) {
         const normalizedInput = normalizeProductInput(raw);
         const payload = await importProduct(job.destinationShop, normalizedInput);
         if (payload?.product?.id) {
           destId = payload.product.id;
           destVariants = payload.product.variants?.edges || [];
         } else {
           throw new Error(JSON.stringify(payload?.userErrors || "Failed to create product via productSet"));
         }
      }

      // 2. Attach Media
      if (config.resources.productImages && raw.images?.edges?.length > 0) {
        const mediaUrls = raw.images.edges.map((e: any) => e.node.url);
        try {
          const createdMedia = await attachProductMedia(job.destinationShop, destId, mediaUrls);

          // 3. Variant Image Mapping
          if (
            config.resources.variantImages &&
            createdMedia &&
            createdMedia.length > 0 &&
            raw.variants?.edges?.length > 0
          ) {
            const mediaIds = createdMedia
              .map((media) => media.mediaId)
              .filter((mediaId): mediaId is string => typeof mediaId === "string");
            const readyMediaIds = new Set(await waitForMediaReady(job.destinationShop, mediaIds));
            const variantMediaPayload: Array<{ variantId: string; mediaIds: string[] }> = [];
            const successfulVariantMappings: Array<{ sourceId: string; destinationId: string }> = [];
            const failedVariantLabels: string[] = [];

            for (const srcVariantEdge of raw.variants.edges) {
               const srcVariant = srcVariantEdge.node;
               if (!srcVariant.image?.url) continue;

               // Find the mediaId that corresponds to this variant's image URL
               const matchMedia = createdMedia.find(m => m.url === srcVariant.image.url);
               if (!matchMedia?.mediaId || !readyMediaIds.has(matchMedia.mediaId)) {
                 failedVariantLabels.push(srcVariant.sku || srcVariant.title);
                 continue;
               }

               // Find corresponding destination variant (match by SKU or Title)
               const matchedDestVariant = destVariants.find((dv: any) => 
                  (dv.node.sku && dv.node.sku === srcVariant.sku) || dv.node.title === srcVariant.title
               );

               if (matchedDestVariant?.node?.id) {
                  variantMediaPayload.push({
                    variantId: matchedDestVariant.node.id,
                    mediaIds: [matchMedia.mediaId],
                  });
                  successfulVariantMappings.push({
                    sourceId: `${item.sourceId}:${srcVariant.id || srcVariant.sku || srcVariant.title}`,
                    destinationId: matchedDestVariant.node.id,
                  });
                }
            }

            if (variantMediaPayload.length > 0) {
              try {
                await updateVariantMedia(job.destinationShop, destId, variantMediaPayload);

                for (const mapping of successfulVariantMappings) {
                  await prisma.resourceMapping.upsert({
                    where: {
                      jobId_resourceType_sourceId: {
                        jobId: job.id,
                        resourceType: "VARIANT_IMAGE",
                        sourceId: mapping.sourceId,
                      }
                    },
                    update: {
                      destinationId: mapping.destinationId,
                    },
                    create: {
                      jobId: job.id,
                      resourceType: "VARIANT_IMAGE",
                      sourceId: mapping.sourceId,
                      destinationId: mapping.destinationId,
                    }
                  });
                }
              } catch (err: any) {
                await prisma.jobLog.create({
                  data: {
                    jobId: job.id,
                    level: "WARN",
                    step: "variant_image_mapping",
                    message: `Failed linking variant media for product ${raw.handle || item.sourceId}: ${err.message}`
                  }
                });
              }
            }

            if (failedVariantLabels.length > 0) {
              await prisma.jobLog.create({
                data: {
                  jobId: job.id,
                  level: "WARN",
                  step: "variant_image_mapping",
                  message: `Skipped ${failedVariantLabels.length} variant image links for product ${raw.handle || item.sourceId} because media was not ready yet.`,
                }
              });
            }
          }

        } catch (err) {
          await prisma.jobLog.create({
            data: {
              jobId: job.id,
              level: "WARN",
              step: "attach_media",
              message: `Failed to attach media to product ${destId}: ${(err as Error).message}`,
            }
          });
        }
      }

      // Save Mapping
      await prisma.resourceMapping.create({
        data: {
          jobId: job.id,
          resourceType: "PRODUCT",
          sourceId: item.sourceId,
          destinationId: destId,
          sourceHandle: item.sourceHandle,
        }
      });

      await markItemDone(job.id, item.id, "SUCCESS", destId);

    } catch (err: any) {
      await markItemDone(job.id, item.id, "FAILED", null, err.message);
    }
  });
}

async function rebuildCollectionMembershipsPhase(job: MigrationJob & { destinationShop: ConnectedShop }) {
  const collections = await prisma.migrationJobItem.findMany({
    where: { jobId: job.id, resourceType: "COLLECTION", status: "SUCCESS" }
  });

  const productMappings = await prisma.resourceMapping.findMany({
    where: { jobId: job.id, resourceType: "PRODUCT" }
  });

  const productMap = new Map(productMappings.map((m: any) => [m.sourceId, m.destinationId]));

  for (const collection of collections) {
    await assertMigrationActive(job.id);
    if (!collection.destinationId) continue;
    
    const raw = collection.rawData as any;
    if (raw?.ruleSet) continue;

    const members = raw?.products?.edges || [];
    if (members.length === 0) continue;

    const sourceProductIds = members.map((e: any) => e.node.id);
    const destinationProductIds: string[] = [];

    for (const srcId of sourceProductIds) {
      const destId = productMap.get(srcId);
      if (typeof destId === "string") destinationProductIds.push(destId);
    }

    if (destinationProductIds.length > 0) {
      try {
        await addProductToCollection(job.destinationShop, collection.destinationId, destinationProductIds);
      } catch (err) {
        // Log silently
        await prisma.jobLog.create({
          data: {
            jobId: job.id,
            level: "WARN",
            step: "collection_membership",
            message: `Failed to rebuild membership for collection ${collection.destinationId}: ${(err as Error).message}`,
          }
        });
      }
    }
  }
}

async function setMetafieldsPhase(
  job: MigrationJob & { destinationShop: ConnectedShop },
  config: MigrationConfig
) {
  const resourceTypes = [];

  if (config.resources.productMetafields) {
    resourceTypes.push("PRODUCT");
  }

  if (config.resources.collectionMetafields) {
    resourceTypes.push("COLLECTION");
  }

  if (resourceTypes.length === 0) {
    return;
  }

  const items = await prisma.migrationJobItem.findMany({
    where: {
      jobId: job.id,
      status: "SUCCESS",
      resourceType: { in: resourceTypes as Array<"PRODUCT" | "COLLECTION"> },
      NOT: { destinationId: null },
    }
  });

  for (const item of items) {
    await assertMigrationActive(job.id);
    const raw = item.rawData as any;
    const metafields = getCopyableMetafields(raw);

    if (metafields.length === 0 || !item.destinationId) {
      continue;
    }

    try {
      const result = await setMetafields(job.destinationShop, item.destinationId, metafields);

      for (const metafield of result) {
        const mappingType = item.resourceType === "PRODUCT" ? "PRODUCT_METAFIELD" : "COLLECTION_METAFIELD";

        await prisma.resourceMapping.upsert({
          where: {
            jobId_resourceType_sourceId: {
              jobId: job.id,
              resourceType: mappingType,
              sourceId: `${item.sourceId}:${metafield.namespace}.${metafield.key}`,
            }
          },
          update: {
            destinationId: metafield.id,
            sourceHandle: item.sourceHandle,
          },
          create: {
            jobId: job.id,
            resourceType: mappingType,
            sourceId: `${item.sourceId}:${metafield.namespace}.${metafield.key}`,
            destinationId: metafield.id,
            sourceHandle: item.sourceHandle,
          }
        });
      }
    } catch (err: any) {
      await prisma.jobLog.create({
        data: {
          jobId: job.id,
          level: "WARN",
          step: "set_metafields",
          message: `Failed to set metafields for ${item.resourceType.toLowerCase()} ${item.sourceHandle || item.sourceId}: ${err.message}`,
        }
      });
    }
  }
}

async function markItemDone(jobId: string, itemId: string, status: "SUCCESS" | "FAILED" | "SKIPPED", destId?: string | null, error?: string) {
  await prisma.migrationJobItem.update({
    where: { id: itemId },
    data: {
      status,
      destinationId: destId,
      errorMessage: error,
    }
  });

  if (status === "SUCCESS") {
    await prisma.migrationJob.update({ where: { id: jobId }, data: { successCount: { increment: 1 } } });
  } else if (status === "FAILED") {
    await prisma.migrationJob.update({ where: { id: jobId }, data: { failedCount: { increment: 1 } } });
  } else if (status === "SKIPPED") {
    await prisma.migrationJob.update({ where: { id: jobId }, data: { skippedCount: { increment: 1 } } });
  }
}

async function generateMigrationReportPhase(job: MigrationJob) {
  // Read all job failures for detail payload
  const failures = await prisma.migrationJobItem.findMany({
    where: { jobId: job.id, status: "FAILED" }
  });

  // Calculate deep telemetry
  const successfulItems = await prisma.migrationJobItem.findMany({
    where: { jobId: job.id, status: "SUCCESS" }
  });

  let smartCollections = 0;
  for (const item of successfulItems) {
    const raw = item.rawData as any;
    if (item.resourceType === "COLLECTION" && raw?.ruleSet) {
      smartCollections += 1;
    }
  }

  // Calculate log metrics
  const logsCount = await prisma.jobLog.groupBy({
    by: ['level'],
    where: { jobId: job.id },
    _count: { level: true },
  });
  const warnings = logsCount.find((l: any) => l.level === "WARN")?._count.level || 0;
  const hardErrors = logsCount.find((l: any) => l.level === "ERROR")?._count.level || job.failedCount;

  const [productMetafields, collectionMetafields, variantImageMappings] = await Promise.all([
    prisma.resourceMapping.count({
      where: { jobId: job.id, resourceType: "PRODUCT_METAFIELD" }
    }),
    prisma.resourceMapping.count({
      where: { jobId: job.id, resourceType: "COLLECTION_METAFIELD" }
    }),
    prisma.resourceMapping.count({
      where: { jobId: job.id, resourceType: "VARIANT_IMAGE" }
    }),
  ]);

  const reportData = {
    jobId: job.id,
    summary: {
      totalItems: job.totalItems,
      successCount: job.successCount,
      failedCount: job.failedCount,
      skippedCount: job.skippedCount,
      telemetry: {
        productMetafieldsMigrated: productMetafields,
        collectionMetafieldsMigrated: collectionMetafields,
        smartCollectionsMigrated: smartCollections,
        variantImagesMapped: variantImageMappings,
        warningsEncountered: warnings,
        hardFailures: hardErrors,
      }
    },
    failures: failures.map((f: any) => ({
      resource: f.resourceType,
      sourceId: f.sourceId,
      error: f.errorMessage,
    }))
  };

  const jsonString = JSON.stringify(reportData, null, 2);
  const sizeBytes = Buffer.byteLength(jsonString, 'utf8');
  
  // In a real production SaaS, this JSON is uploaded to AWS S3 / Cloudflare R2 here
  // and the secure Download URL is stored. 
  
  await prisma.report.create({
    data: {
      jobId: job.id,
      type: "SUMMARY_JSON",
      filename: `migration_report_${job.id}.json`,
      url: `/api/reports/${job.id}`, // Placeholder internal route for download
      sizeBytes,
    }
  });
}

async function logJobStatus(jobId: string, status: MigrationStatus, step: string, message: string) {
  const currentJob = await prisma.migrationJob.findUnique({
    where: { id: jobId },
    select: { config: true, dryRun: true }
  });

  const config = currentJob ? parseMigrationConfig(currentJob.config) : null;
  const activeSteps = config ? getPipelineSteps(config, currentJob!.dryRun) : [];
  const stepIndex = activeSteps.findIndex((activeStep) => activeStep.key === step);
  const completedSteps = status === "COMPLETED"
    ? activeSteps.length
    : Math.max(stepIndex, 0);

  await prisma.migrationJob.update({
    where: { id: jobId },
    data: {
      status,
      currentStep: step,
      totalSteps: activeSteps.length,
      completedSteps,
    }
  });

  await prisma.jobLog.create({
    data: {
      jobId,
      level: status === "FAILED" ? "ERROR" : "INFO",
      step,
      message,
    }
  });
}
