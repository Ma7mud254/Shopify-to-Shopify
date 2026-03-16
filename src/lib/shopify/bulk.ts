import { ConnectedShop } from "@prisma/client";
import { getGraphqlClient } from "./client";

/**
 * Starts a bulk operation on a Shopify store using a provided GraphQL query.
 */
export async function startBulkOperation(shop: ConnectedShop, queryStr: string) {
  const client = getGraphqlClient(shop);
  
  const mutation = `
    mutation bulkOperationRunQuery($query: String!) {
      bulkOperationRunQuery(query: $query) {
        bulkOperation {
          id
          status
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await client.request(mutation, {
    variables: { query: queryStr },
  });

  const payload = response.data?.bulkOperationRunQuery;
  
  if (payload?.userErrors?.length > 0) {
    throw new Error(`Bulk operation failed to start: ${JSON.stringify(payload.userErrors)}`);
  }

  return payload?.bulkOperation;
}

/**
 * Polls the current bulk operation status.
 */
export async function getBulkOperationStatus(shop: ConnectedShop) {
  const client = getGraphqlClient(shop);
  
  const query = `
    query {
      currentBulkOperation {
        id
        status
        errorCode
        createdAt
        completedAt
        objectCount
        fileSize
        url
        partialDataUrl
      }
    }
  `;

  const response = await client.request(query);

  return response.data?.currentBulkOperation;
}

/**
 * Starts a bulk mutation operation (e.g., creating products) using a JSONL file URL.
 */
export async function startBulkMutation(shop: ConnectedShop, mutationStr: string, stagedUploadPath: string) {
  const client = getGraphqlClient(shop);
  
  const mutation = `
    mutation bulkOperationRunMutation($mutation: String!, $stagedUploadPath: String!) {
      bulkOperationRunMutation(mutation: $mutation, stagedUploadPath: $stagedUploadPath) {
        bulkOperation {
          id
          status
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
      mutation: mutationStr,
      stagedUploadPath
    },
  });

  const payload = response.data?.bulkOperationRunMutation;
  
  if (payload?.userErrors?.length > 0) {
    throw new Error(`Bulk mutation failed to start: ${JSON.stringify(payload.userErrors)}`);
  }

  return payload?.bulkOperation;
}
