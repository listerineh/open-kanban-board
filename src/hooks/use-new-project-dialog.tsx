'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useKanbanStore, type AddProjectOptions } from './use-kanban-store';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Project, Label as LabelType, Column } from '@/types/kanban';
import { Separator } from '@/components/ui/separator';
import { Check, Edit, Palette, Plus, Trash2, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type NewProjectDialogContextType = {
  openDialog: () => void;
};

const NewProjectDialogContext = createContext<NewProjectDialogContextType | undefined>(undefined);

export function useNewProjectDialog() {
  const context = useContext(NewProjectDialogContext);
  if (!context) {
    throw new Error('useNewProjectDialog must be used within a NewProjectDialogProvider');
  }
  return context;
}

const MAX_PROJECT_NAME_LENGTH = 50;
const MAX_PROJECT_DESC_LENGTH = 200;
const MAX_LABEL_NAME_LENGTH = 20;
const MAX_COLUMN_TITLE_LENGTH = 30;

const getColumnsFromTemplate = (
  template: 'default' | 'dev' | 'content-creation' | 'educational',
): Omit<Column, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>[] => {
  switch (template) {
    case 'dev':
      return [
        { title: 'Backlog' },
        { title: 'To Do' },
        { title: 'In Progress' },
        { title: 'Code Review' },
        { title: 'Done' },
      ];
    case 'content-creation':
      return [{ title: 'Ideas' }, { title: 'Drafting' }, { title: 'Review' }, { title: 'Done' }];
    case 'educational':
      return [{ title: 'To Research' }, { title: 'In Progress' }, { title: 'Reviewing' }, { title: 'Done' }];
    case 'default':
    default:
      return [{ title: 'To Do' }, { title: 'In Progress' }, { title: 'Done' }];
  }
};

const colorSwatches = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#78716c',
  '#64748b',
];

const getLabelsFromTemplate = (
  template: 'default' | 'dev' | 'content-creation' | 'educational',
): Omit<LabelType, 'id'>[] => {
  switch (template) {
    case 'dev':
      return [
        { name: 'Bug', color: '#ef4444' },
        { name: 'Feature', color: '#3b82f6' },
        { name: 'Improvement', color: '#22c55e' },
      ];
    case 'content-creation':
      return [
        { name: 'Video', color: '#ef4444' },
        { name: 'Blog Post', color: '#3b82f6' },
        { name: 'Social Media', color: '#14b8a6' },
      ];
    case 'educational':
      return [
        { name: 'Assignment', color: '#f97316' },
        { name: 'Reading', color: '#3b82f6' },
        { name: 'Exam', color: '#ef4444' },
        { name: 'Project', color: '#8b5cf6' },
      ];
    case 'default':
    default:
      return [
        { name: 'Urgent', color: '#ef4444' },
        { name: 'Idea', color: '#a855f7' },
      ];
  }
};

export function NewProjectDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

  // Step 1 state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Step 2 state
  const [features, setFeatures] = useState({
    enableSubtasks: true,
    enableDeadlines: true,
    enableLabels: true,
    enableDashboard: true,
  });
  const [autoArchivePeriod, setAutoArchivePeriod] = useState<Project['autoArchivePeriod']>('1-month');

  // Step 3 state
  const [template, setTemplate] = useState<'default' | 'dev' | 'content-creation' | 'educational'>('default');
  const [columns, setColumns] = useState<Omit<Column, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>[]>(
    getColumnsFromTemplate('default'),
  );
  const [labels, setLabels] = useState<Omit<LabelType, 'id'>[]>(getLabelsFromTemplate('default'));

  // Step 3 - temp state for editing
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(colorSwatches[0]);
  const [editingLabel, setEditingLabel] = useState<(Omit<LabelType, 'id'> & { tempId: number }) | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const addProject = useKanbanStore((state) => state.actions.addProject);
  const router = useRouter();

  const resetState = useCallback(() => {
    setStep(1);
    setName('');
    setDescription('');
    setTemplate('default');
    setColumns(getColumnsFromTemplate('default'));
    setLabels(getLabelsFromTemplate('default'));
    setFeatures({
      enableSubtasks: true,
      enableDeadlines: true,
      enableLabels: true,
      enableDashboard: true,
    });
    setAutoArchivePeriod('1-month');
  }, []);

  const openDialog = useCallback(() => {
    resetState();
    setIsOpen(true);
  }, [resetState]);

  const handleTemplateChange = (newTemplate: 'default' | 'dev' | 'content-creation' | 'educational') => {
    setTemplate(newTemplate);
    setColumns(getColumnsFromTemplate(newTemplate));
    setLabels(getLabelsFromTemplate(newTemplate));
  };

  const handleColumnTitleChange = (index: number, newTitle: string) => {
    setColumns((currentColumns) => currentColumns.map((c, i) => (i === index ? { ...c, title: newTitle } : c)));
  };

  const handleAddColumn = () => {
    const doneColumnIndex = columns.findIndex((c) => c.title.toLowerCase() === 'done');
    const newColumns = [...columns];
    const newColumn = { title: 'New Column' };

    if (doneColumnIndex !== -1) {
      newColumns.splice(doneColumnIndex, 0, newColumn);
    } else {
      newColumns.push(newColumn);
    }
    setColumns(newColumns);
  };

  const handleDeleteColumn = (index: number) => {
    setColumns((currentColumns) => currentColumns.filter((_, i) => i !== index));
  };

  const handleProjectSubmit = async () => {
    if (name.trim() && !isSubmitting) {
      setIsSubmitting(true);

      const projectData: AddProjectOptions = {
        name: name.trim(),
        description: description.trim(),
        template,
        labels,
        columns,
        ...features,
        autoArchivePeriod,
      };

      const newProjectId = await addProject(projectData);
      setIsSubmitting(false);
      resetState();
      setIsOpen(false);
      if (newProjectId) {
        router.push(`/p/${newProjectId}`);
      }
    }
  };

  const handleFeatureChange = (key: keyof typeof features, value: any) => {
    setFeatures((prev) => ({ ...prev, [key]: value }));
  };

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const tempLabels = useMemo(() => labels.map((l, i) => ({ ...l, tempId: i })), [labels]);

  const handleAddLabel = () => {
    if (!newLabelName.trim()) return;
    setLabels((prev) => [...prev, { name: newLabelName, color: newLabelColor }]);
    setNewLabelName('');
    setNewLabelColor(colorSwatches[0]);
  };

  const handleUpdateLabel = () => {
    if (!editingLabel || !editingLabel.name.trim()) return;
    setLabels((prev) =>
      prev.map((l, i) => (i === editingLabel.tempId ? { name: editingLabel.name, color: editingLabel.color } : l)),
    );
    setEditingLabel(null);
  };

  const handleDeleteLabel = (tempId: number) => {
    setLabels((prev) => prev.filter((l, i) => i !== tempId));
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <div className="space-y-1">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Website Redesign"
                  maxLength={MAX_PROJECT_NAME_LENGTH}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {name.length} / {MAX_PROJECT_NAME_LENGTH}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <div className="space-y-1">
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A short description of the project"
                  maxLength={MAX_PROJECT_DESC_LENGTH}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {description.length} / {MAX_PROJECT_DESC_LENGTH}
                </p>
              </div>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div className="space-y-3">
              <Label>Features</Label>
              <div className="flex items-center justify-between p-3 rounded-md border">
                <Label htmlFor="subtasks-switch" className="font-normal text-sm">
                  Enable Sub-tasks
                </Label>
                <Switch
                  id="subtasks-switch"
                  checked={features.enableSubtasks}
                  onCheckedChange={(val) => handleFeatureChange('enableSubtasks', val)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border">
                <Label htmlFor="deadlines-switch" className="font-normal text-sm">
                  Enable Deadlines
                </Label>
                <Switch
                  id="deadlines-switch"
                  checked={features.enableDeadlines}
                  onCheckedChange={(val) => handleFeatureChange('enableDeadlines', val)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border">
                <Label htmlFor="labels-switch" className="font-normal text-sm">
                  Enable Labels
                </Label>
                <Switch
                  id="labels-switch"
                  checked={features.enableLabels}
                  onCheckedChange={(val) => handleFeatureChange('enableLabels', val)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border">
                <Label htmlFor="dashboard-switch" className="font-normal text-sm">
                  Enable Dashboard
                </Label>
                <Switch
                  id="dashboard-switch"
                  checked={features.enableDashboard}
                  onCheckedChange={(val) => handleFeatureChange('enableDashboard', val)}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Automation</Label>
              <div className="flex items-center justify-between p-3 rounded-md border">
                <Label htmlFor="auto-archive-select" className="font-normal text-sm">
                  Auto-archive tasks
                </Label>
                <Select
                  value={autoArchivePeriod}
                  onValueChange={(val) => setAutoArchivePeriod(val as Project['autoArchivePeriod'])}
                >
                  <SelectTrigger className="w-48" id="auto-archive-select">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-day">After 1 day</SelectItem>
                    <SelectItem value="1-week">After 1 week</SelectItem>
                    <SelectItem value="1-month">After 1 month</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <div className="space-y-2">
              <Label>Project Template</Label>
              <RadioGroup
                value={template}
                onValueChange={handleTemplateChange}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2"
              >
                <div>
                  <RadioGroupItem value="default" id="template-default" className="peer sr-only" />
                  <Label
                    htmlFor="template-default"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    Default Kanban
                    <span className="text-xs text-muted-foreground mt-1 text-center">To Do, In Progress, Done</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="dev" id="template-dev" className="peer sr-only" />
                  <Label
                    htmlFor="template-dev"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    Software Development
                    <span className="text-xs text-muted-foreground mt-1 text-center">
                      Backlog, In Progress, Review...
                    </span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="content-creation" id="template-content" className="peer sr-only" />
                  <Label
                    htmlFor="template-content"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    Content Creation
                    <span className="text-xs text-muted-foreground mt-1 text-center">
                      Ideas, Drafting, Review, Done
                    </span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="educational" id="template-educational" className="peer sr-only" />
                  <Label
                    htmlFor="template-educational"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    Educational
                    <span className="text-xs text-muted-foreground mt-1 text-center">To Research, In Progress...</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <Separator />
            <div className="space-y-3">
              <Label>Board Columns</Label>
              <div className="space-y-2">
                {columns.map((column, index) => {
                  const isDoneColumn = column.title.toLowerCase() === 'done';
                  return (
                    <div key={index} className="flex items-center gap-2 p-1 pl-3 border rounded-lg">
                      <Input
                        value={column.title}
                        onChange={(e) => handleColumnTitleChange(index, e.target.value)}
                        className="flex-grow bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
                        disabled={isDoneColumn}
                        maxLength={MAX_COLUMN_TITLE_LENGTH}
                      />
                      {!isDoneColumn && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteColumn(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
              <Button variant="outline" size="sm" onClick={handleAddColumn}>
                <Plus className="h-4 w-4 mr-2" />
                Add Column
              </Button>
            </div>
            {features.enableLabels && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label>Labels</Label>
                  <div className="space-y-2">
                    {tempLabels.map((label) => (
                      <div key={label.tempId} className="flex items-center gap-2 p-2 px-3 rounded-md border">
                        {editingLabel?.tempId === label.tempId ? (
                          <>
                            <div
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: editingLabel.color }}
                            ></div>
                            <Input
                              value={editingLabel.name}
                              onChange={(e) => setEditingLabel({ ...editingLabel, name: e.target.value })}
                              className="flex-grow h-8 bg-transparent"
                              onKeyDown={(e) => e.key === 'Enter' && handleUpdateLabel()}
                              maxLength={MAX_LABEL_NAME_LENGTH}
                            />
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="icon" className="w-8 h-8 flex-shrink-0">
                                  <Palette className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-2">
                                <div className="grid grid-cols-4 gap-2">
                                  {colorSwatches.map((color) => (
                                    <Button
                                      key={color}
                                      variant="outline"
                                      size="icon"
                                      className="w-7 h-7"
                                      onClick={() => setEditingLabel({ ...editingLabel, color })}
                                    >
                                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
                                      {editingLabel.color === color && (
                                        <Check className="w-3 h-3 text-white mix-blend-difference absolute" />
                                      )}
                                    </Button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                            <Button size="icon" className="h-8 w-8" onClick={handleUpdateLabel}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => setEditingLabel(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: label.color }}></div>
                            <span className="flex-grow font-medium text-sm">{label.name}</span>
                            <div className="flex items-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditingLabel({ ...label })}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDeleteLabel(label.tempId)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 p-1 border rounded-lg">
                    <Input
                      placeholder="New label name..."
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      className="flex-grow bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
                      maxLength={MAX_LABEL_NAME_LENGTH}
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="w-8 h-8 flex-shrink-0">
                          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: newLabelColor }}></div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2">
                        <div className="grid grid-cols-4 gap-2">
                          {colorSwatches.map((color) => (
                            <Button
                              key={color}
                              variant="outline"
                              size="icon"
                              className="w-7 h-7"
                              onClick={() => setNewLabelColor(color)}
                            >
                              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
                              {newLabelColor === color && (
                                <Check className="w-3 h-3 text-white mix-blend-difference absolute" />
                              )}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button onClick={handleAddLabel} size="sm">
                      <Plus className="h-4 w-4 mr-1 sm:mr-2" /> Add
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <NewProjectDialogContext.Provider value={{ openDialog }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="sm:max-w-2xl flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Create New Project (Step {step} of 3)</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto space-y-4 p-1">
            <div className="px-4 space-y-4">{renderStepContent()}</div>
          </div>
          <DialogFooter>
            {step > 1 && (
              <Button variant="outline" onClick={prevStep}>
                Back
              </Button>
            )}
            <div className="flex-grow" />
            {step < 3 ? (
              <Button onClick={nextStep} disabled={step === 1 && !name.trim()}>
                Next
              </Button>
            ) : (
              <Button type="submit" onClick={handleProjectSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </NewProjectDialogContext.Provider>
  );
}
