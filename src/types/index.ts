// ─── Migration Config Types ─────────────────────────────────────

export interface MigrationConfig {
  resources: MigrationResources;
  conflictBehavior: ConflictBehavior;
  dryRun: boolean;
}

export interface MigrationResources {
  products: boolean;
  variants: boolean;
  productImages: boolean;
  variantImages: boolean;
  collections: boolean;
  manualCollections: boolean;
  smartCollections: boolean;
  productMetafields: boolean;
  collectionMetafields: boolean;
  tags: boolean;
  seo: boolean;
}

export type ConflictBehavior = "skip" | "update" | "overwrite";

export function parseMigrationConfig(config: unknown): MigrationConfig {
  if (typeof config === "string") {
    return JSON.parse(config) as MigrationConfig;
  }

  return config as MigrationConfig;
}

// ─── Job / Pipeline Types ───────────────────────────────────────

export type MigrationStatus =
  | "PENDING"
  | "VALIDATING"
  | "EXPORTING"
  | "PROCESSING"
  | "IMPORTING"
  | "FINALIZING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELED"
  | "PAUSED";

export type ItemStatus = "PENDING" | "IN_PROGRESS" | "SUCCESS" | "FAILED" | "SKIPPED";

export type ResourceType =
  | "PRODUCT"
  | "VARIANT"
  | "COLLECTION"
  | "PRODUCT_IMAGE"
  | "VARIANT_IMAGE"
  | "PRODUCT_METAFIELD"
  | "COLLECTION_METAFIELD"
  | "COLLECTION_MEMBERSHIP";

export const PIPELINE_STEPS = [
  { key: "validate", label: "Validate Input" },
  { key: "verify_stores", label: "Verify Stores" },
  { key: "export_collections", label: "Export Collections" },
  { key: "validate_metafields", label: "Validate Metafield Definitions" },
  { key: "create_metafields", label: "Create Metafield Definitions" },
  { key: "export_products", label: "Export Products" },
  { key: "import_collections", label: "Import Collections" },
  { key: "import_products", label: "Import Products" },
  { key: "attach_media", label: "Attach Media" },
  { key: "set_metafields", label: "Set Metafields" },
  { key: "collection_membership", label: "Rebuild Collection Membership" },
  { key: "generate_report", label: "Generate Report" },
  { key: "complete", label: "Complete" },
] as const;

export type PipelineStepKey = (typeof PIPELINE_STEPS)[number]["key"];

export function getPipelineSteps(config: MigrationConfig, dryRun: boolean) {
  const steps: Array<(typeof PIPELINE_STEPS)[number]> = [
    PIPELINE_STEPS.find((step) => step.key === "validate")!,
    PIPELINE_STEPS.find((step) => step.key === "verify_stores")!,
  ];

  if (config.resources.collections) {
    steps.push(PIPELINE_STEPS.find((step) => step.key === "export_collections")!);
  }

  if ((config.resources.productMetafields || config.resources.collectionMetafields) && !dryRun) {
    steps.push(PIPELINE_STEPS.find((step) => step.key === "validate_metafields")!);
    steps.push(PIPELINE_STEPS.find((step) => step.key === "create_metafields")!);
  }

  if (config.resources.products) {
    steps.push(PIPELINE_STEPS.find((step) => step.key === "export_products")!);
  }

  if (config.resources.collections && !dryRun) {
    steps.push(PIPELINE_STEPS.find((step) => step.key === "import_collections")!);
  }

  if (config.resources.products && !dryRun) {
    steps.push(PIPELINE_STEPS.find((step) => step.key === "import_products")!);
  }

  if (
    !dryRun &&
    ((config.resources.products && config.resources.productMetafields) ||
      (config.resources.collections && config.resources.collectionMetafields))
  ) {
    steps.push(PIPELINE_STEPS.find((step) => step.key === "set_metafields")!);
  }

  if (config.resources.manualCollections && !dryRun) {
    steps.push(PIPELINE_STEPS.find((step) => step.key === "collection_membership")!);
  }

  steps.push(PIPELINE_STEPS.find((step) => step.key === "generate_report")!);
  steps.push(PIPELINE_STEPS.find((step) => step.key === "complete")!);

  return steps;
}

// ─── Connected Shop Types ───────────────────────────────────────

export interface ConnectedShop {
  id: string;
  shopDomain: string;
  shopName: string;
  primaryDomain?: string;
  currency?: string;
  country?: string;
  lastSyncAt?: string;
  installedAt: string;
}

// ─── Migration Job Types ────────────────────────────────────────

export interface MigrationJob {
  id: string;
  status: MigrationStatus;
  currentStep: string | null;
  totalSteps: number;
  completedSteps: number;
  totalItems: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  config: MigrationConfig;
  dryRun: boolean;
  sourceShop: ConnectedShop;
  destinationShop: ConnectedShop;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface MigrationJobItem {
  id: string;
  resourceType: ResourceType;
  sourceId: string;
  sourceHandle?: string;
  sourceTitle?: string;
  destinationId?: string;
  status: ItemStatus;
  errorMessage?: string;
  retryCount: number;
}

export interface JobLogEntry {
  id: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  step?: string;
  message: string;
  createdAt: string;
}

// ─── Dashboard Stats ────────────────────────────────────────────

export interface DashboardStats {
  totalMigrations: number;
  completedMigrations: number;
  failedMigrations: number;
  totalProductsMigrated: number;
  totalCollectionsMigrated: number;
  connectedStores: number;
}
