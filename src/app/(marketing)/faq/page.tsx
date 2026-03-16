"use client";

import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How does Shopify store connection work?",
    a: "ExportBase uses Shopify's official OAuth flow. You'll be redirected to Shopify to authorize read access on the source store and read/write access on the destination store. Your tokens are encrypted and never exposed to the browser.",
  },
  {
    q: "What data can I migrate?",
    a: "Products (title, handle, description, vendor, type, tags, status, SEO fields), variants (SKU, barcode, price, compare-at price, options), product images, variant images, collections (manual and smart), collection images, product metafields, and collection metafields.",
  },
  {
    q: "What happens if a product already exists in the destination?",
    a: "You choose the conflict behavior before each migration: skip duplicates, update existing products, or overwrite them entirely. Products are matched by handle, with optional SKU matching for variants.",
  },
  {
    q: "Can I do a test run before migrating?",
    a: "Yes! Dry-run mode validates everything without writing any data to your destination store. You'll get a full report showing what would happen.",
  },
  {
    q: "How long does a migration take?",
    a: "It depends on your catalog size. A store with 500 products and images typically completes in 3–5 minutes. Larger stores (5,000+ products) may take 15–30 minutes. Migrations run in the background so you can close the tab.",
  },
  {
    q: "What if a migration fails partway through?",
    a: "ExportBase tracks every item individually. You can retry just the failed items without re-importing everything. Jobs are designed to be resumable and idempotent.",
  },
  {
    q: "Are smart collection rules migrated?",
    a: "Yes, ExportBase migrates smart collection rules when possible. Some rules that reference destination-specific data may need manual review.",
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. Shopify tokens are encrypted at rest, all communication is over HTTPS, and tokens are never sent to the client. We maintain audit logs for every migration action.",
  },
  {
    q: "Can I use ExportBase for multiple stores?",
    a: "Yes. You can connect multiple source and destination stores within your workspace and run migrations between any combination of them.",
  },
];

export default function FAQPage() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Badge variant="secondary" className="mb-4">FAQ</Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h1>
          <p className="mt-4 text-muted-foreground">
            Everything you need to know about ExportBase and Shopify catalog migration.
          </p>
        </div>

        <Accordion className="mt-12">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-sm font-medium">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
