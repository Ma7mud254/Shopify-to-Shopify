import { ConnectedShop } from "@prisma/client";
import { getGraphqlClient } from "./client";

/**
 * Fetches the first N publications (sales channels) on the store.
 */
export async function getPublications(shop: ConnectedShop, limit: number = 10) {
  const client = getGraphqlClient(shop);
  
  const query = `
    query getStorePublications($first: Int!) {
      publications(first: $first) {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  `;

  const response = await client.request(query, {
    variables: { first: limit },
  });

  const edges = response.data?.publications?.edges || [];
  return edges.map((e: any) => e.node);
}

/**
 * Publishes a resource (product or collection) to a specific publication channel.
 */
export async function publishResource(shop: ConnectedShop, resourceId: string, publicationId: string) {
  const client = getGraphqlClient(shop);
  
  const mutation = `
    mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        publishable {
          availablePublicationCount
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
      id: resourceId,
      input: [{ publicationId }],
    },
  });

  const payload = response.data?.publishablePublish;
  
  if (payload?.userErrors?.length > 0) {
    throw new Error(`Failed to publish resource: ${JSON.stringify(payload.userErrors)}`);
  }

  return payload?.publishable;
}

/**
 * Bulk publishes a resource to all available channels
 */
export async function publishToAllChannels(shop: ConnectedShop, resourceId: string) {
  const publications = await getPublications(shop, 50);
  
  if (publications.length === 0) return null;
  
  const client = getGraphqlClient(shop);
  
  const input = publications.map((pub: any) => ({ publicationId: pub.id }));
  
  const mutation = `
    mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        publishable {
          availablePublicationCount
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
      id: resourceId,
      input,
    },
  });

  const payload = response.data?.publishablePublish;

  if (payload?.userErrors?.length > 0) {
    throw new Error(`Failed to bulk publish resource: ${JSON.stringify(payload.userErrors)}`);
  }

  return payload;
}
