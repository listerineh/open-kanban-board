'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Code, Github, LogOut, PlusCircle, Palette, Moon, Sun, Monitor, Menu, Bell, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNewProjectDialog } from '@/hooks/use-new-project-dialog';
import { useTheme } from '@/hooks/use-theme';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useNotifications } from '@/hooks/use-notifications';
import { Badge } from '../ui/badge';
import { Notifications } from '../notifications/Notifications';
import { Separator } from '../ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { THEME_OPTIONS } from '@/lib/constants';

export function UserNav() {
  const { user } = useAuth();
  const router = useRouter();
  const { openDialog } = useNewProjectDialog();
  const { theme: colorTheme, setTheme: setColorTheme, mode, setMode } = useTheme();
  const { unreadCount } = useNotifications();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (!user) {
    return null;
  }

  const menuItems = (
    <>
      <DropdownMenuItem onClick={openDialog} className="cursor-pointer">
        <PlusCircle className="mr-2 h-4 w-4 text-primary" />
        New Project
      </DropdownMenuItem>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          {mode === 'light' && <Sun className="mr-2 h-4 w-4 text-primary" />}
          {mode === 'dark' && <Moon className="mr-2 h-4 w-4 text-primary" />}
          {mode === 'black' && <Monitor className="mr-2 h-4 w-4 text-primary" />}
          Theme
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            <DropdownMenuCheckboxItem checked={mode === 'light'} onSelect={() => setMode('light')}>
              <Sun className="mr-2 h-4 w-4" /> Light
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={mode === 'dark'} onSelect={() => setMode('dark')}>
              <Moon className="mr-2 h-4 w-4" /> Dark
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={mode === 'black'} onSelect={() => setMode('black')}>
              <Monitor className="mr-2 h-4 w-4" /> Black
            </DropdownMenuCheckboxItem>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Palette className="mr-2 h-4 w-4 text-primary" />
          Accent Color
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            {THEME_OPTIONS.map((t) => (
              <DropdownMenuCheckboxItem
                key={t.value}
                checked={colorTheme === t.value}
                onSelect={() => setColorTheme(t.value as any)}
              >
                <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: t.color }}></div>
                {t.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>

      <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
        <LogOut className="mr-2 h-4 w-4 text-primary" />
        Log out
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => window.open('https://listerineh.dev', '_blank')} className="cursor-pointer">
        <Code className="mr-2 h-4 w-4 text-primary" />
        <span>Built by Listerineh</span>
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => window.open('https://github.com/listerineh/open-kanban-board/', '_blank')}
        className="cursor-pointer"
      >
        <Github className="mr-2 h-4 w-4 text-primary" />
        <span>GitHub Repository</span>
      </DropdownMenuItem>
    </>
  );

  const mobileMenuItems = (
    <div className="flex flex-col gap-1 p-2">
      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={() => {
          openDialog();
          setIsMobileNavOpen(false);
        }}
      >
        <PlusCircle className="mr-2 h-4 w-4 text-primary" />
        New Project
      </Button>
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-start group">
            {mode === 'light' && <Sun className="mr-2 h-4 w-4 text-primary" />}
            {mode === 'dark' && <Moon className="mr-2 h-4 w-4 text-primary" />}
            {mode === 'black' && <Monitor className="mr-2 h-4 w-4 text-primary" />}
            Theme
            <ChevronDown className="h-4 w-4 ml-auto transition-transform group-data-[state=open]:rotate-180" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 pl-6">
          <Button
            variant={mode === 'light' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setMode('light')}
          >
            <Sun className="mr-2 h-4 w-4" /> Light
          </Button>
          <Button
            variant={mode === 'dark' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setMode('dark')}
          >
            <Moon className="mr-2 h-4 w-4" /> Dark
          </Button>
          <Button
            variant={mode === 'black' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setMode('black')}
          >
            <Monitor className="mr-2 h-4 w-4" /> Black
          </Button>
        </CollapsibleContent>
      </Collapsible>
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-start group">
            <Palette className="mr-2 h-4 w-4 text-primary" />
            Accent Color
            <ChevronDown className="h-4 w-4 ml-auto transition-transform group-data-[state=open]:rotate-180" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 pl-6">
          {THEME_OPTIONS.map((t) => (
            <Button
              key={t.value}
              variant={colorTheme === t.value ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setColorTheme(t.value as any)}
            >
              <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: t.color }}></div>
              {t.name}
            </Button>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Separator className="my-2" />
      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={() => {
          window.open('https://listerineh.dev', '_blank');
          setIsMobileNavOpen(false);
        }}
      >
        <Code className="mr-2 h-4 w-4 text-primary" />
        <span>Built by Listerineh</span>
      </Button>
      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={() => {
          window.open('https://github.com/listerineh/open-kanban-board/', '_blank');
          setIsMobileNavOpen(false);
        }}
      >
        <Github className="mr-2 h-4 w-4 text-primary" />
        <span>GitHub Repository</span>
      </Button>
      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={() => {
          handleSignOut();
          setIsMobileNavOpen(false);
        }}
      >
        <LogOut className="mr-2 h-4 w-4 text-primary" />
        Log out
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
              <AvatarFallback>{user.displayName?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
            </Avatar>
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full max-w-sm p-0 flex flex-col">
          <SheetHeader className="p-4 border-b text-left">
            <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                <AvatarFallback>{user.displayName?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </SheetHeader>
          <Tabs defaultValue="menu" className="flex-grow flex flex-col min-h-0">
            <TabsList className="flex-shrink-0 w-full justify-evenly rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="menu"
                className="flex-1 gap-2 rounded-none border-b-2 border-transparent bg-transparent p-4 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                <Menu className="h-4 w-4" /> Menu
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="flex-1 gap-2 rounded-none border-b-2 border-transparent bg-transparent p-4 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                <Bell className="h-4 w-4" /> Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="h-5 w-5 justify-center p-0">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="menu" className="flex-grow overflow-y-auto">
              {mobileMenuItems}
            </TabsContent>
            <TabsContent value="notifications" className="flex-grow overflow-y-auto">
              <Notifications isMobile />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
            <AvatarFallback>{user.displayName?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {menuItems}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
