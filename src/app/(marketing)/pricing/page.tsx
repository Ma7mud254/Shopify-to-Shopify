"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { fadeUp } from "@/lib/animations";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Perfect for testing a single migration.",
    features: [
      "1 migration per month",
      "Up to 100 products",
      "Products & variants",
      "Basic reporting",
      "Community support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    desc: "For small-to-medium stores that need full control.",
    features: [
      "10 migrations per month",
      "Up to 5,000 products",
      "All resource types",
      "Collections & metafields",
      "Detailed reports",
      "Email support",
      "Dry-run mode",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Pro",
    price: "$79",
    period: "/month",
    desc: "For agencies and merchants with large catalogs.",
    features: [
      "Unlimited migrations",
      "Unlimited products",
      "All resource types",
      "Smart collection rules",
      "Variant images",
      "Downloadable reports",
      "Priority support",
      "Team workspace",
      "Retry & resume",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For large operations needing dedicated support.",
    features: [
      "Everything in Pro",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantees",
      "SSO / SAML",
      "Audit logs",
      "On-call support",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">Pricing</Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-muted-foreground">
            Start free. Upgrade when you need more migrations, more products, or team features.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <Card
                className={`relative flex h-full flex-col ${
                  plan.popular
                    ? "border-primary shadow-lg shadow-primary/10"
                    : "border-border/50"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="px-3">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.desc}</p>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/register" className="w-full">
                    <Button
                      className="w-full gap-1.5"
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.cta} <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
