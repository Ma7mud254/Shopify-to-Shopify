import "@shopify/shopify-api/adapters/node";
import { shopifyApi, ApiVersion } from "@shopify/shopify-api";

export const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY || "",
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  scopes: process.env.SHOPIFY_SCOPES?.split(",") || [
    "read_products", "write_products",
    "read_product_listings",
    "read_inventory", "write_inventory",
    "read_publications", "write_publications",
    "read_content", "write_content",
  ],
  hostName: process.env.SHOPIFY_APP_URL?.replace(/^https?:\/\//, "") || "localhost:3000",
  apiVersion: ApiVersion.October24,
  isEmbeddedApp: false, // ExportBase is a standalone SaaS Dashboard, not an embedded Shopify Admin app.
});
