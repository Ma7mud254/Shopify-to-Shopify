"use client";

import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteStore } from "@/app/actions/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeleteStoreButton({ shopId, shopDomain }: { shopId: string; shopDomain: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    setLoading(true);
    try {
      const res = await deleteStore(shopId);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Store ${shopDomain} deleted`);
        setOpen(false);
      }
    } catch (err: any) {
      toast.error("Failed to delete store");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            className={cn(
              buttonVariants({
                variant: "ghost",
                size: "icon",
                className: "h-8 w-8 text-muted-foreground hover:text-destructive",
              })
            )}
          />
        }
      >
        <Trash2 className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Store Connection</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the connection to <strong>{shopDomain}</strong>? 
            This will stop and remove any migrations that use this store.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={loading}
            className="gap-2"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            {loading ? "Deleting..." : "Delete Store"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
