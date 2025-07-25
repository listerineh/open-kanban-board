"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useKanbanStore } from "./use-kanban-store";
import { useRouter } from "next/navigation";

type NewProjectDialogContextType = {
  openDialog: () => void;
};

const NewProjectDialogContext = createContext<
  NewProjectDialogContextType | undefined
>(undefined);

export function useNewProjectDialog() {
  const context = useContext(NewProjectDialogContext);
  if (!context) {
    throw new Error(
      "useNewProjectDialog must be used within a NewProjectDialogProvider",
    );
  }
  return context;
}

export function NewProjectDialogProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const store = useKanbanStore();
  const router = useRouter();

  const openDialog = useCallback(() => {
    setNewProjectName("");
    setIsOpen(true);
  }, []);

  const handleProjectSubmit = async () => {
    if (newProjectName.trim() && !isSubmitting) {
      setIsSubmitting(true);
      const newProjectId = await store.addProject(newProjectName.trim());
      setIsSubmitting(false);
      setNewProjectName("");
      setIsOpen(false);
      if (newProjectId) {
        router.push(`/p/${newProjectId}`);
      }
    }
  };

  return (
    <NewProjectDialogContext.Provider value={{ openDialog }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="sm:max-w-[425px]"
        >
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="col-span-3"
                placeholder="e.g. Website Redesign"
                onKeyDown={(e) => e.key === "Enter" && handleProjectSubmit()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleProjectSubmit}
              disabled={!newProjectName.trim() || isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </NewProjectDialogContext.Provider>
  );
}
