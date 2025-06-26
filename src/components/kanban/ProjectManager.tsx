"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronsUpDown, PlusCircle, Edit, DeleteIcon } from 'lucide-react';
import type { Project } from '@/types/kanban';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type ProjectManagerProps = {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onAddProject: (name: string) => void;
  onUpdateProjectName: (id: string, name: string) => void;
  onDeleteProject: (id: string) => void;
};

export function ProjectManager({
  projects,
  activeProjectId,
  onSelectProject,
  onAddProject,
  onUpdateProjectName,
  onDeleteProject,
}: ProjectManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  const handleProjectSubmit = () => {
    if (newProjectName.trim()) {
      if (isEditing && activeProjectId) {
        onUpdateProjectName(activeProjectId, newProjectName.trim());
      } else {
        onAddProject(newProjectName.trim());
      }
      closeDialog();
    }
  };
  
  const closeDialog = () => {
    setIsDialogOpen(false);
    setIsEditing(false);
    setNewProjectName('');
  }

  const openNewProjectDialog = () => {
    setIsEditing(false);
    setNewProjectName('');
    setIsDialogOpen(true);
  }

  const openRenameProjectDialog = () => {
    if (activeProject) {
      setIsEditing(true);
      setNewProjectName(activeProject.name);
      setIsDialogOpen(true);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-40 sm:w-48 justify-between">
              <span className="truncate">{activeProject?.name || 'Select Project'}</span>
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuLabel>Projects</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {projects.map((project) => (
              <DropdownMenuItem key={project.id} onSelect={() => onSelectProject(project.id)}>
                {project.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={openNewProjectDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              <span>New Project</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {activeProject && (
          <>
            <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={openRenameProjectDialog}>
                      <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Rename Project</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => onDeleteProject(activeProject.id)}>
                      <DeleteIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete Project</p>
                </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => !isOpen && closeDialog()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Rename Project' : 'Create New Project'}</DialogTitle>
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
                onKeyDown={(e) => e.key === 'Enter' && handleProjectSubmit()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleProjectSubmit}>{isEditing ? 'Save changes' : 'Create Project'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
