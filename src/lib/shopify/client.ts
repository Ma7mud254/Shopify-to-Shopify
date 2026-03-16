import { shopify } from "@/lib/shopify";
import { ConnectedShop } from "@prisma/client";
import { Session } from "@shopify/shopify-api";
import { decryptToken } from "../encryption";

/**
 * Creates an ephemeral Shopify API Session object from a database ConnectedShop
 * to power the GraphQL/REST clients.
 */
export function createShopifySession(shop: ConnectedShop): Session {
  if (!shop.accessToken) {
    throw new Error(`Shop ${shop.shopDomain} is missing an access token.`);
  }

  // Construct a session object mimicking what the library expects internally
  const decryptedToken = decryptToken(shop.accessToken);

  const session = new Session({
    id: `offline_${shop.shopDomain}`,
    shop: shop.shopDomain,
    state: shop.state || "",
    isOnline: false,
    accessToken: decryptedToken,
    scope: shop.scopes || process.env.SHOPIFY_SCOPES || "read_products,write_products",
  });

  return session;
}

/**
 * Returns a configured GraphQL client for the given shop
 */
export function getGraphqlClient(shop: ConnectedShop) {
  const session = createShopifySession(shop);
  return new shopify.clients.Graphql({ session });
}

/**
 * Returns a configured REST client for the given shop
 */
export function getRestClient(shop: ConnectedShop) {
  const session = createShopifySession(shop);
  return new shopify.clients.Rest({ session });
}
