"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

type NewColumnDialogProps = {
  projectId: string;
  onAddColumn: (projectId: string, title: string) => Promise<void>;
};

export function NewColumnDialog({
  projectId,
  onAddColumn,
}: NewColumnDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddColumn = async () => {
    if (title.trim() && !isSubmitting) {
      setIsSubmitting(true);
      await onAddColumn(projectId, title.trim());
      setIsSubmitting(false);
      setTitle("");
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-full border-dashed hover:bg-primary/10 hover:border-primary text-muted-foreground hover:text-primary"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add new column
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Column</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
              placeholder="e.g. Review"
              onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleAddColumn}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add Column"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
