# Deploying ExportBase

This app has two runtime processes:

- `web`: the Next.js dashboard and API routes
- `worker`: the BullMQ migration worker

It also needs:

- PostgreSQL
- Redis

## Recommended host

Render is the easiest option for this project because it supports all four pieces in one place.

## Files included

- [render.yaml](/C:/Users/Taha/Desktop/Shopify%20to%20Shopify%20Migration/exportbase/render.yaml)
- [`.env.production.example`](/C:/Users/Taha/Desktop/Shopify%20to%20Shopify%20Migration/exportbase/.env.production.example)

## Before deploying

1. Push this repo to GitHub.
2. Make sure your production secrets are ready.
3. Make sure `prisma/migrations` is committed.

## Required environment variables

These must be set for both the web service and the worker:

- `DATABASE_URL`
- `REDIS_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `TOKEN_ENCRYPTION_KEY`
- `SHOPIFY_API_KEY`
- `SHOPIFY_API_SECRET`
- `SHOPIFY_APP_URL`
- `SHOPIFY_SCOPES`

Optional:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `S3_ENDPOINT`
- `S3_BUCKET`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `S3_REGION`
- `SENTRY_DSN`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Render setup

### Web service

- Build command: `npm install && npx prisma generate && npm run build`
- Pre-deploy command: `npx prisma migrate deploy`
- Start command: `npm run start`

### Worker service

- Build command: `npm install && npx prisma generate`
- Start command: `npm run worker`

## Shopify production settings

After deployment, update your Shopify app config:

- Application URL: `https://your-domain.com`
- Allowed redirection URL: `https://your-domain.com/api/shopify/callback`

If these are wrong, store connection will fail online.

## Deploy flow

1. Create a Render Blueprint from this repo.
2. Render will create the web service, worker, Postgres, and Redis.
3. Fill in the secret environment variables in Render.
4. Deploy.
5. Open the app and test:
   - sign in
   - create workspace
   - connect source and destination stores
   - start a small migration

## Production commands to test locally

```bash
npm run build
npm run start
```

In another terminal:

```bash
npm run worker
```
