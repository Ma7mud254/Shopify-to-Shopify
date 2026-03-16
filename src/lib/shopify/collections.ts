import { ConnectedShop } from "@prisma/client";
import { getGraphqlClient } from "./client";

const GET_COLLECTIONS_QUERY = `
  query getCollections($cursor: String) {
    collections(first: 50, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          handle
          descriptionHtml
          image {
            url
            altText
          }
          ruleSet {
            appliedDisjunctively
            rules {
              column
              relation
              condition
            }
          }
          metafields(first: 50) {
            edges {
              node {
                id
                namespace
                key
                value
                type
                description
              }
            }
          }
          products(first: 250) {
            edges {
              node {
                id
                handle
              }
            }
          }
        }
      }
    }
  }
`;

export async function exportCollectionsBatched(shop: ConnectedShop, cursor?: string) {
  const client = getGraphqlClient(shop);
  
  const response = await client.request(GET_COLLECTIONS_QUERY, {
    variables: {
      cursor: cursor || null,
    },
  });

  return response.data?.collections;
}

const CREATE_COLLECTION_MUTATION = `
  mutation collectionCreate($input: CollectionInput!) {
    collectionCreate(input: $input) {
      collection {
        id
        handle
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function importCollection(shop: ConnectedShop, collectionData: any) {
  const client = getGraphqlClient(shop);
  
  // Convert standard collection data to CollectionInput
  const input: any = {
    title: collectionData.title,
    handle: collectionData.handle,
    descriptionHtml: collectionData.descriptionHtml,
  };

  if (collectionData.ruleSet) {
    input.ruleSet = {
      appliedDisjunctively: collectionData.ruleSet.appliedDisjunctively,
      rules: collectionData.ruleSet.rules.map((rule: any) => ({
        column: rule.column,
        relation: rule.relation,
        condition: rule.condition
      }))
    };
  }

  const response = await client.request(CREATE_COLLECTION_MUTATION, {
    variables: {
      input,
    },
  });

  return response.data?.collectionCreate;
}

export async function getCollectionByHandle(shop: ConnectedShop, handle: string) {
  const client = getGraphqlClient(shop);
  
  const query = `
    query getCollectionByHandle($query: String!) {
      collections(first: 1, query: $query) {
        edges {
          node {
            id
            title
            handle
          }
        }
      }
    }
  `;

  const response = await client.request(query, {
    variables: { query: `handle:${handle}` },
  });

  const edges = response.data?.collections?.edges;
  return edges && edges.length > 0 ? edges[0].node : null;
}

export async function addProductToCollection(shop: ConnectedShop, collectionId: string, productIds: string[]) {
  const client = getGraphqlClient(shop);
  
  const mutation = `
    mutation collectionAddProducts($id: ID!, $productIds: [ID!]!) {
      collectionAddProducts(id: $id, productIds: $productIds) {
        collection {
          id
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
      id: collectionId,
      productIds,
    },
  });

  const payload = response.data?.collectionAddProducts;
  if (payload?.userErrors?.length > 0) {
    throw new Error(`Failed to add products to collection: ${JSON.stringify(payload.userErrors)}`);
  }

  return payload;
}
