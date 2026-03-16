"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare } from "lucide-react";

export default function ContactPage() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">Contact</Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Get in touch
          </h1>
          <p className="mt-4 text-muted-foreground">
            Have questions about ExportBase? Want a demo or enterprise pricing? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {/* Contact Form */}
          <Card className="border-border/50">
            <CardContent className="p-6">
              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="Jane" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="jane@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store">Shopify Store URL</Label>
                  <Input id="store" placeholder="your-store.myshopify.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    rows={4}
                    placeholder="Tell us about your migration needs..."
                  />
                </div>
                <Button type="submit" className="w-full gap-1.5">
                  Send Message <MessageSquare className="h-3.5 w-3.5" />
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="flex flex-col gap-6">
            <Card className="border-border/50">
              <CardContent className="flex items-start gap-4 p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Email Support</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Reach us at{" "}
                    <a href="mailto:support@exportbase.io" className="text-primary hover:underline">
                      support@exportbase.io
                    </a>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    We typically respond within 2 business hours.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="flex items-start gap-4 p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Book a Demo</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Want a walkthrough? Book a 15-minute demo with our team to see ExportBase in action.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-xl border border-border/50 bg-gradient-to-br from-primary/5 to-transparent p-6">
              <h3 className="font-semibold">Enterprise?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Need custom integrations, SLAs, or high-volume migration support? Contact us for Enterprise pricing tailored to your needs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
