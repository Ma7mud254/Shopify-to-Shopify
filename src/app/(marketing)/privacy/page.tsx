import { Badge } from "@/components/ui/badge";

export default function PrivacyPage() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Badge variant="secondary" className="mb-4">Legal</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: March 15, 2026</p>

        <div className="prose prose-neutral dark:prose-invert mt-10 max-w-none text-sm leading-relaxed [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mt-3 [&_p]:text-muted-foreground [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:text-muted-foreground">
          <h2>1. Information We Collect</h2>
          <p>When you create an account, we collect your name, email address, and password. When you connect a Shopify store, we receive an OAuth access token scoped to the permissions you authorize.</p>

          <h2>2. How We Use Your Information</h2>
          <p>We use your information to provide the ExportBase migration service, including reading data from your source store and writing data to your destination store. We do not sell or share your personal data with third parties.</p>

          <h2>3. Shopify Store Data</h2>
          <p>ExportBase accesses your Shopify store data solely to perform migration operations you initiate. Data exported from your source store is temporarily processed and is not retained after migration completion beyond audit logs and reports.</p>

          <h2>4. Data Security</h2>
          <p>All Shopify access tokens are encrypted at rest. Communication between ExportBase and Shopify APIs uses HTTPS/TLS. We follow industry best practices for securing your data.</p>

          <h2>5. Data Retention</h2>
          <p>Migration reports and logs are retained for 90 days. You can request deletion of your account and all associated data at any time by contacting support@exportbase.io.</p>

          <h2>6. Cookies</h2>
          <p>We use essential cookies for session management and authentication. We do not use third-party advertising cookies.</p>

          <h2>7. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Material changes will be communicated via email or in-app notification.</p>

          <h2>8. Contact</h2>
          <p>For privacy-related inquiries, contact us at privacy@exportbase.io.</p>
        </div>
      </div>
    </section>
  );
}
