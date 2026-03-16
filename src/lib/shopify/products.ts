import { ConnectedShop } from "@prisma/client";
import { getGraphqlClient } from "./client";

const GET_PRODUCTS_QUERY = `
  query getProducts($cursor: String) {
    products(first: 50, after: $cursor) {
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
          vendor
          productType
          status
          tags
          seo {
            title
            description
          }
          options {
            name
            values
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
          images(first: 20) {
            edges {
              node {
                url
              }
            }
          }
          variants(first: 100) {
            edges {
              node {
                id
                title
                sku
                barcode
                price
                compareAtPrice
                image {
                  id
                  url
                }
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function exportProductsBatched(shop: ConnectedShop, cursor?: string) {
  const client = getGraphqlClient(shop);
  
  const response = await client.request(GET_PRODUCTS_QUERY, {
    variables: {
      cursor: cursor || null,
    },
  });

  return response.data?.products;
}

const PRODUCT_SET_MUTATION = `
  mutation productSet($input: ProductSetInput!) {
    productSet(input: $input) {
      product {
        id
        handle
        variants(first: 100) {
          edges {
            node {
              id
              sku
              title
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function importProduct(shop: ConnectedShop, productInput: any) {
  const client = getGraphqlClient(shop);

  const response = await client.request(PRODUCT_SET_MUTATION, {
    variables: {
      input: productInput,
    },
  });

  return response.data?.productSet;
}

export async function getProductByHandle(shop: ConnectedShop, handle: string) {
  const client = getGraphqlClient(shop);
  
  const query = `
    query getProductByHandle($query: String!) {
      products(first: 1, query: $query) {
        edges {
          node {
            id
            title
            handle
            variants(first: 50) {
              edges {
                node {
                  id
                  sku
                  title
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await client.request(query, {
    variables: { query: `handle:${handle}` },
  });

  const edges = response.data?.products?.edges;
  return edges && edges.length > 0 ? edges[0].node : null;
}
