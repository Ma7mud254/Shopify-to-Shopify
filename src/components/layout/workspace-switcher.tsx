"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, Settings } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createWorkspace, setCurrentWorkspace } from "@/app/actions/workspace";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function WorkspaceSwitcher({
  workspaces,
  currentWorkspace,
}: {
  workspaces: any[];
  currentWorkspace?: any;
}) {
  const [open, setOpen] = React.useState(false);
  const [showNewWorkspaceDialog, setShowNewWorkspaceDialog] = React.useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const handleCreateWorkspace = async () => {
    try {
      setLoading(true);
      const res = await createWorkspace({ name: newWorkspaceName });
      
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      
      toast.success("Workspace created");
      setShowNewWorkspaceDialog(false);
      setNewWorkspaceName("");
      // Refresh the page data so the layout fetches the new workspace
      router.refresh();
    } catch (e) {
      toast.error("Failed to create workspace");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWorkspace = async (workspaceId: string) => {
    const res = await setCurrentWorkspace(workspaceId);

    if (res?.error) {
      toast.error(res.error);
      return;
    }

    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={showNewWorkspaceDialog} onOpenChange={setShowNewWorkspaceDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              className={cn(
                buttonVariants({
                  variant: "outline",
                  className: "w-full justify-between",
                })
              )}
              aria-expanded={open}
              aria-label="Select a workspace"
            />
          }
        >
          <Avatar className="mr-2 h-5 w-5">
            <AvatarFallback>
              {currentWorkspace?.name?.[0]?.toUpperCase() || "W"}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{currentWorkspace?.name || "Select Workspace"}</span>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Search workspace..." />
              <CommandEmpty>No workspace found.</CommandEmpty>
              <CommandGroup heading="Workspaces">
                {workspaces.map((workspace) => (
                  <CommandItem
                    key={workspace.id}
                    onSelect={() => handleSelectWorkspace(workspace.id)}
                    className="text-sm"
                  >
                    <Avatar className="mr-2 h-5 w-5">
                      <AvatarFallback>
                        {workspace.name?.[0]?.toUpperCase() || "W"}
                      </AvatarFallback>
                    </Avatar>
                    {workspace.name}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        currentWorkspace?.id === workspace.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <DialogTrigger
                  nativeButton={false}
                  render={
                    <CommandItem
                      onSelect={() => {
                        setOpen(false);
                        setShowNewWorkspaceDialog(true);
                      }}
                    />
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Workspace
                </DialogTrigger>
                <CommandItem onSelect={() => router.push("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Workspace Settings
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription>
            Add a new workspace to manage a different set of stores and migrations.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Workspace name</Label>
            <Input
              id="name"
              placeholder="Acme Inc."
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setShowNewWorkspaceDialog(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateWorkspace}
            disabled={!newWorkspaceName || loading}
          >
            {loading ? "Creating..." : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
