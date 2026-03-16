import { ConnectedShop } from "@prisma/client";
import { getGraphqlClient } from "../shopify/client";

/**
 * Normalizes raw Shopify Product exports into compatible ProductInput payloads.
 */
export function normalizeProductInput(raw: any) {
  // Map basic string fields
  const input: any = {
    title: raw.title,
    handle: raw.handle,
    descriptionHtml: raw.descriptionHtml,
    vendor: raw.vendor,
    productType: raw.productType,
    status: raw.status || "DRAFT",
  };

  if (raw.tags && raw.tags.length > 0) {
    input.tags = raw.tags;
  }

  // Handle Options mapping for productSet
  if (raw.options && raw.options.length > 0) {
    input.productOptions = raw.options.map((opt: any) => ({
      name: opt.name,
      values: opt.values.map((v: string) => ({ name: v }))
    }));
  }

  // Handle Variants mapping for ProductVariantSetInput
  if (raw.variants?.edges?.length > 0) {
    input.variants = raw.variants.edges.map((edge: any) => {
      const v = edge.node;
      const vInput: any = {
        price: v.price || "0.00",
      };
      if (v.sku) vInput.sku = v.sku;
      if (v.barcode) vInput.barcode = v.barcode;
      if (v.compareAtPrice) vInput.compareAtPrice = v.compareAtPrice;
      
      // Map options to optionValues for productSet
      if (v.selectedOptions && raw.options) {
        vInput.optionValues = v.selectedOptions.map((so: any) => ({
          optionName: so.name,
          name: so.value
        }));
      }
      
      return vInput;
    });
  }

  return input;
}

/**
 * Attaches media (images/videos) to a product in Shopify.
 * This should be called AFTER the product is created.
 */
export async function attachProductMedia(
  destinationShop: ConnectedShop,
  destinationProductId: string,
  mediaUrls: string[]
) {
  const client = getGraphqlClient(destinationShop);

  // Prepare the media inputs
  const mediaInputs = mediaUrls.map((url) => ({
    mediaContentType: "IMAGE",
    originalSource: url,
  }));

  const mutation = `
    mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media {
          id
          status
          ... on MediaImage {
             image { url }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await client.request(mutation, {
    variables: {
      productId: destinationProductId,
      media: mediaInputs,
    },
  });

  const payload = response.data?.productCreateMedia;
  if (payload?.userErrors?.length > 0) {
    throw new Error(JSON.stringify(payload.userErrors));
  }

  // productCreateMedia returns the created media in the SAME ORDER as the input array
  const createdMedia = payload?.media || [];
  return mediaUrls.map((url, index) => ({
    url,
    mediaId: createdMedia[index]?.id,
    status: createdMedia[index]?.status,
  }));
}

/**
 * Poll media nodes until Shopify marks them READY before attaching to variants.
 */
export async function waitForMediaReady(
  destinationShop: ConnectedShop,
  mediaIds: string[],
  maxAttempts = 6,
  delayMs = 2000
) {
  const client = getGraphqlClient(destinationShop);
  const pendingIds = [...new Set(mediaIds.filter(Boolean))];

  if (pendingIds.length === 0) {
    return [];
  }

  const query = `
    query getMediaNodes($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on MediaImage {
          id
          status
        }
      }
    }
  `;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await client.request(query, {
      variables: { ids: pendingIds },
    });

    const nodes = response.data?.nodes || [];
    const readyIds = nodes
      .filter((node: any) => node?.status === "READY")
      .map((node: any) => node.id);

    if (readyIds.length === pendingIds.length) {
      return readyIds;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  const finalResponse = await client.request(query, {
    variables: { ids: pendingIds },
  });

  return (finalResponse.data?.nodes || [])
    .filter((node: any) => node?.status === "READY")
    .map((node: any) => node.id);
}

/**
 * Links uploaded Media IDs to product variants in a single batched mutation.
 */
export async function updateVariantMedia(
  destinationShop: ConnectedShop,
  productId: string,
  variantMedia: Array<{ variantId: string; mediaIds: string[] }>
) {
  const client = getGraphqlClient(destinationShop);

  const mutation = `
    mutation productVariantAppendMedia($productId: ID!, $variantMedia: [ProductVariantAppendMediaInput!]!) {
      productVariantAppendMedia(productId: $productId, variantMedia: $variantMedia) {
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await client.request(mutation, {
    variables: {
      productId,
      variantMedia,
    },
  });

  const payload = response.data?.productVariantAppendMedia;
  if (payload?.userErrors?.length > 0) {
    throw new Error(JSON.stringify(payload.userErrors));
  }
}
