"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  Boxes,
  Clock,
  Database,
  FileText,
  Image,
  Layers,
  Lock,
  RefreshCcw,
  Settings,
  Shield,
  Tags,
  Zap,
} from "lucide-react";
import { fadeUp } from "@/lib/animations";

const allFeatures = [
  { icon: Boxes, title: "Full Product Transfer", desc: "Titles, handles, descriptions, vendors, product types, tags, status, options, and all variant data." },
  { icon: Image, title: "Image Migration", desc: "Product images and variant images with alt text, position, and correct variant associations." },
  { icon: Layers, title: "Collections", desc: "Manual and smart collections with full membership, descriptions, images, and smart rules." },
  { icon: Tags, title: "Metafields", desc: "Product and collection metafields with automatic definition detection and creation on the destination." },
  { icon: FileText, title: "SEO Preservation", desc: "SEO titles, meta descriptions, and URL handles transferred exactly as configured." },
  { icon: Database, title: "SKU & Barcode", desc: "All variant SKUs, barcodes, pricing, and compare-at pricing migrated accurately." },
  { icon: ArrowLeftRight, title: "Conflict Resolution", desc: "Choose to skip duplicates, update existing items, or overwrite — per migration." },
  { icon: RefreshCcw, title: "Retry & Resume", desc: "Failed items can be retried individually. Jobs can be partially re-run without duplicating." },
  { icon: Shield, title: "Dry-Run Mode", desc: "Validate your migration without writing any data to the destination store." },
  { icon: Clock, title: "Real-Time Progress", desc: "Live progress bars, step indicators, and streaming logs during migration." },
  { icon: Lock, title: "Encrypted Tokens", desc: "Shopify access tokens encrypted at rest. Never exposed to the client." },
  { icon: Settings, title: "Bulk Operations", desc: "Uses Shopify GraphQL Bulk Operations for fast, efficient large-scale exports." },
  { icon: Zap, title: "Background Jobs", desc: "Migrations run in background workers — your dashboard stays responsive." },
  { icon: FileText, title: "Downloadable Reports", desc: "Summary reports, failure CSVs, and detailed logs available for every migration." },
];

export default function FeaturesPage() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">Features</Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Built for serious Shopify migrations
          </h1>
          <p className="mt-4 text-muted-foreground">
            Every feature designed around the real complexity of moving data between Shopify stores.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {allFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <Card className="group h-full border-border/50 transition-all hover:border-primary/30 hover:shadow-md">
                <CardContent className="p-5">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
