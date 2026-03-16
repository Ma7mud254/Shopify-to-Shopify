import { Badge } from "@/components/ui/badge";

export default function TermsPage() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Badge variant="secondary" className="mb-4">Legal</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: March 15, 2026</p>

        <div className="prose prose-neutral dark:prose-invert mt-10 max-w-none text-sm leading-relaxed [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mt-3 [&_p]:text-muted-foreground [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:text-muted-foreground">
          <h2>1. Acceptance of Terms</h2>
          <p>By using ExportBase, you agree to these Terms of Service. If you do not agree, do not use the service.</p>

          <h2>2. Service Description</h2>
          <p>ExportBase provides a SaaS platform for migrating Shopify catalog data between stores. The service includes data export, import, and reporting functionality.</p>

          <h2>3. Account Responsibilities</h2>
          <p>You are responsible for maintaining the security of your account credentials. You are responsible for all activity under your account. You must have authorization to connect and migrate data from any Shopify store you use with ExportBase.</p>

          <h2>4. Acceptable Use</h2>
          <p>You agree not to misuse the service, including attempting to access stores without authorization, circumventing rate limits, or using the service for competitive data extraction.</p>

          <h2>5. Data Ownership</h2>
          <p>You retain ownership of all data migrated through ExportBase. We claim no ownership of your Shopify store data.</p>

          <h2>6. Limitation of Liability</h2>
          <p>ExportBase is provided &ldquo;as is.&rdquo; We are not liable for data loss during migration to the extent permitted by law. We strongly recommend dry-run validation before running production migrations.</p>

          <h2>7. Billing</h2>
          <p>Paid plans are billed monthly. You may cancel at any time. Refunds are handled on a case-by-case basis.</p>

          <h2>8. Termination</h2>
          <p>We may suspend or terminate your account for violation of these terms. You may delete your account at any time.</p>

          <h2>9. Changes to Terms</h2>
          <p>We may update these terms from time to time. Continued use after changes constitutes acceptance.</p>

          <h2>10. Contact</h2>
          <p>For questions about these terms, contact legal@exportbase.io.</p>
        </div>
      </div>
    </section>
  );
}
