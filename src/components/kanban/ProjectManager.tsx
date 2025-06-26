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
import { ChevronsUpDown, PlusCircle, Settings } from 'lucide-react';
import type { Project } from '@/types/kanban';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';

type ProjectManagerProps = {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onAddProject: (name: string) => void;
};

export function ProjectManager({
  projects,
  activeProjectId,
  onSelectProject,
  onAddProject,
}: ProjectManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const isMobile = useIsMobile();

  const activeProject = projects.find((p) => p.id === activeProjectId);

  const handleProjectSubmit = () => {
    if (newProjectName.trim()) {
      onAddProject(newProjectName.trim());
      closeDialog();
    }
  };
  
  const closeDialog = () => {
    setIsDialogOpen(false);
    setNewProjectName('');
  }

  const openNewProjectDialog = () => {
    setNewProjectName('');
    setIsDialogOpen(true);
  }

  return (
    <>
      <div className={`flex items-center justify-between gap-2 ${isMobile ? 'w-full' : ''}`}>
        <div className='w-full'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-48 justify-between">
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
        </div>
        {activeProject && (
            <Tooltip>
                <TooltipTrigger asChild>
                <Link href={`/config/${activeProject.id}`} passHref>
                    <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                    </Button>
                </Link>
                </TooltipTrigger>
                <TooltipContent>
                <p>Project Settings</p>
                </TooltipContent>
            </Tooltip>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => !isOpen && closeDialog()}>
        <DialogContent className="sm:max-w-[425px]">
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
                onKeyDown={(e) => e.key === 'Enter' && handleProjectSubmit()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleProjectSubmit}>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
