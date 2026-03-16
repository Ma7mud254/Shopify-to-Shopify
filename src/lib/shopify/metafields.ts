import { ConnectedShop } from "@prisma/client";
import { getGraphqlClient } from "./client";

const GET_METAFIELD_DEFINITIONS_QUERY = `
  query getMetafieldDefinitions($cursor: String, $ownerType: MetafieldOwnerType!) {
    metafieldDefinitions(first: 50, after: $cursor, ownerType: $ownerType) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          name
          namespace
          key
          description
          type {
            name
          }
        }
      }
    }
  }
`;

export async function exportMetafieldDefinitions(shop: ConnectedShop, ownerType: "PRODUCT" | "COLLECTION", cursor?: string) {
  const client = getGraphqlClient(shop);
  
  const response = await client.request(GET_METAFIELD_DEFINITIONS_QUERY, {
    variables: {
      ownerType,
      cursor: cursor || null,
    },
  });

  return response.data?.metafieldDefinitions;
}

const CREATE_METAFIELD_DEFINITION_MUTATION = `
  mutation metafieldDefinitionCreate($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition {
        id
        namespace
        key
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function importMetafieldDefinition(shop: ConnectedShop, definitionData: any) {
  const client = getGraphqlClient(shop);
  
  const definition = {
    name: definitionData.name,
    namespace: definitionData.namespace,
    key: definitionData.key,
    description: definitionData.description,
    type: definitionData.type.name,
    ownerType: definitionData.ownerType,
  };

  const response = await client.request(CREATE_METAFIELD_DEFINITION_MUTATION, {
    variables: {
      definition,
    },
  });

  return response.data?.metafieldDefinitionCreate;
}

const METAFIELDS_SET_MUTATION = `
  mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        namespace
        key
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function setMetafields(
  shop: ConnectedShop,
  ownerId: string,
  metafields: Array<{ namespace: string; key: string; value: string; type: string }>
) {
  const client = getGraphqlClient(shop);

  const response = await client.request(METAFIELDS_SET_MUTATION, {
    variables: {
      metafields: metafields.map((metafield) => ({
        ownerId,
        namespace: metafield.namespace,
        key: metafield.key,
        type: metafield.type,
        value: metafield.value,
      })),
    },
  });

  const payload = response.data?.metafieldsSet;
  if (payload?.userErrors?.length > 0) {
    throw new Error(JSON.stringify(payload.userErrors));
  }

  return payload?.metafields || [];
}
