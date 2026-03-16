"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Store } from "lucide-react";
import { beginStoreConnection } from "@/app/actions/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ConnectStoreDialog({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    const msg = searchParams.get("msg");
    const connected = searchParams.get("connected");
    const shop = searchParams.get("shop");

    if (error === "auth_failed") {
      toast.error(`Authentication failed: ${msg || "Unknown error"}`, {
        duration: 10000,
      });
    } else if (connected === "true") {
      toast.success(`Store ${shop || ""} connected successfully!`);
    }
  }, [searchParams]);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    formData.append("workspaceId", workspaceId);
    
    try {
      const res = await beginStoreConnection(formData);
      if (res?.error) {
        toast.error(res.error);
        setLoading(false);
      }
      // If successful, it redirects, so we don't strictly need to close or set false here
    } catch (err: any) {
      // In Next.js, redirect() throws an error that should not be caught as an exception
      if (err.message === "NEXT_REDIRECT") return;
      
      console.error("Connection Error:", err);
      toast.error("An unexpected error occurred.");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className={cn(buttonVariants({ variant: "default", className: "gap-1.5" }))} />
        }
      >
        <Plus className="h-3.5 w-3.5" /> Connect Store
      </DialogTrigger>
      <DialogContent>
        <form action={onSubmit}>
          <DialogHeader>
            <DialogTitle>Connect a Shopify Store</DialogTitle>
            <DialogDescription>
              Enter your store domain to begin the OAuth authorization flow.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="storeDomain">Store Domain</Label>
              <Input 
                id="storeDomain" 
                name="storeDomain" 
                placeholder="your-store.myshopify.com" 
                required
                disabled={loading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              You&apos;ll be redirected to Shopify to authorize ExportBase to access your store data.
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="gap-1.5">
              <Store className="h-3.5 w-3.5" /> 
              {loading ? "Connecting..." : "Connect via Shopify"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
