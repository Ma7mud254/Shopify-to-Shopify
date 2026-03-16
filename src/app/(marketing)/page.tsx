"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Image,
  Layers,
  Package,
  RefreshCcw,
  Shield,
  Sparkles,
  Tags,
  Zap,
} from "lucide-react";
import { fadeUp } from "@/lib/animations";
import { useSession } from "next-auth/react";

const features = [
  { icon: Package, title: "Products & Variants", desc: "Titles, handles, descriptions, tags, vendors, types, status, pricing, SKUs, barcodes, and all variant options." },
  { icon: Image, title: "Product Images", desc: "All product and variant images with alt text preservation. Media attached to the correct variants." },
  { icon: Layers, title: "Collections", desc: "Manual and smart collections with names, descriptions, images, rules, and product membership." },
  { icon: Tags, title: "Metafields", desc: "Product and collection metafields with automatic definition detection and creation on the destination store." },
  { icon: Sparkles, title: "SEO Data", desc: "SEO titles, descriptions, and URL handles preserved exactly as they are in the source store." },
  { icon: Shield, title: "Safe & Idempotent", desc: "Dry-run mode, conflict resolution settings, retry logic, and resumable jobs keep your data safe." },
];

const stats = [
  { value: "50K+", label: "Products migrated" },
  { value: "99.9%", label: "Success rate" },
  { value: "< 5 min", label: "Avg. migration time" },
  { value: "24/7", label: "Monitoring" },
];

export default function LandingPage() {
  const { data: session } = useSession();

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute right-0 top-40 h-[400px] w-[400px] rounded-full bg-chart-2/6 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28 lg:px-8 lg:pt-36">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
              <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1.5 text-sm font-medium">
                <Zap className="h-3.5 w-3.5" />
                Shopify-to-Shopify Migration Platform
              </Badge>
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1}
              className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
            >
              Migrate your entire
              <span className="bg-gradient-to-r from-primary to-chart-5 bg-clip-text text-transparent">
                {" "}Shopify catalog{" "}
              </span>
              in minutes
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={2}
              className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground"
            >
              Transfer products, collections, images, and metafields between Shopify stores
              with confidence. No CSV files. No manual work. Just connect and go.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={3}
              className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Link href={session ? "/dashboard" : "/register"}>
                <Button size="lg" className="gap-2 text-base">
                  {session ? "Go to Dashboard" : "Start Free Migration"} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/features">
                <Button variant="outline" size="lg" className="text-base">
                  See How It Works
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Hero visual card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" }}
            className="mx-auto mt-16 max-w-4xl"
          >
            <div className="rounded-2xl border border-border/60 bg-card/80 p-1.5 shadow-2xl shadow-primary/5 backdrop-blur-sm">
              <div className="rounded-xl border border-border/40 bg-gradient-to-b from-muted/50 to-card p-6 sm:p-8">
                {/* Fake dashboard preview */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-3 w-3 rounded-full bg-destructive/60" />
                  <div className="h-3 w-3 rounded-full bg-warning/60" />
                  <div className="h-3 w-3 rounded-full bg-success/60" />
                  <div className="ml-4 h-5 w-48 rounded bg-muted" />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: "Products", value: "1,247" },
                    { label: "Collections", value: "28" },
                    { label: "Images", value: "3,891" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border border-border/40 bg-background/50 p-4">
                      <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                      <p className="mt-1 text-2xl font-bold">{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 flex-1 rounded-full bg-muted">
                      <div className="h-2.5 w-[85%] rounded-full bg-gradient-to-r from-primary to-chart-1" />
                    </div>
                    <span className="text-sm font-semibold">85%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Importing products — 1,060 of 1,247 completed</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Stats ────────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-muted/20">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="text-center"
            >
              <p className="text-3xl font-extrabold">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Features Grid ────────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">Features</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to migrate
            </h2>
            <p className="mt-4 text-muted-foreground">
              ExportBase handles every part of your Shopify catalog migration — from products to metafields.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <Card className="group h-full border-border/50 bg-card/80 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it Works ─────────────────────────────────── */}
      <section className="border-t border-border/40 bg-muted/20 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps to a complete migration
            </h2>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl gap-8 md:grid-cols-3">
            {[
              { step: "01", icon: Boxes, title: "Connect Stores", desc: "Connect your source and destination Shopify stores via secure OAuth." },
              { step: "02", icon: RefreshCcw, title: "Choose & Migrate", desc: "Select what to migrate, set conflict rules, and start the migration." },
              { step: "03", icon: CheckCircle2, title: "Review Report", desc: "Get a detailed report with success, failure, and skip counts." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="relative text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  Step {item.step}
                </span>
                <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-chart-5 p-10 text-center text-primary-foreground shadow-xl sm:p-16">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent)]" />
            <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to migrate your store?
            </h2>
            <p className="relative mx-auto mt-4 max-w-lg text-base text-primary-foreground/80">
              Start your first migration for free. No credit card required.
            </p>
            <div className="relative mt-8">
              <Link href={session ? "/dashboard" : "/register"}>
                <Button size="lg" variant="secondary" className="gap-2 text-base font-semibold">
                  {session ? "Go to Dashboard" : "Get Started Free"} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
