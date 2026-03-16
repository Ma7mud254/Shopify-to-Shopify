# ExportBase

ExportBase is a Shopify-to-Shopify migration app built with Next.js, Prisma, BullMQ, PostgreSQL, and Redis.

## Local development

Install dependencies:

```bash
npm install
```

Run the web app:

```bash
npm run dev
```

Run the migration worker in a second terminal:

```bash
npm run worker
```

## Environment variables

Use [`.env.example`](/C:/Users/Taha/Desktop/Shopify%20to%20Shopify%20Migration/exportbase/.env.example) for local development.

Use [`.env.production.example`](/C:/Users/Taha/Desktop/Shopify%20to%20Shopify%20Migration/exportbase/.env.production.example) for production hosting.

## Production deployment

This app needs:

- one web service for Next.js
- one worker service for BullMQ
- one PostgreSQL database
- one Redis instance

Recommended host: Render.

Files included for deployment:

- [render.yaml](/C:/Users/Taha/Desktop/Shopify%20to%20Shopify%20Migration/exportbase/render.yaml)
- [DEPLOYMENT.md](/C:/Users/Taha/Desktop/Shopify%20to%20Shopify%20Migration/exportbase/DEPLOYMENT.md)
- [`.env.production.example`](/C:/Users/Taha/Desktop/Shopify%20to%20Shopify%20Migration/exportbase/.env.production.example)

## Production checklist

```bash
npm run build
npm run start
npm run worker
```

Then:

1. Push the repo to GitHub.
2. Create the Render services from `render.yaml`.
3. Fill in the required secret environment variables.
4. Update your Shopify app URLs to your public domain.
