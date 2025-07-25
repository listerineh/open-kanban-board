"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Code, Github, LogOut, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useNewProjectDialog } from "@/hooks/use-new-project-dialog";

export function UserNav() {
  const { user } = useAuth();
  const router = useRouter();
  const { openDialog } = useNewProjectDialog();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user.photoURL ?? ""}
              alt={user.displayName ?? "User"}
            />
            <AvatarFallback>
              {user.displayName?.charAt(0).toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.displayName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={openDialog} className="cursor-pointer">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Project
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => window.open("https://listerineh.dev", "_blank")}
          className="cursor-pointer"
        >
          <Code className="mr-2 h-4 w-4" />
          <span>Built by Listerineh</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            window.open(
              "https://github.com/listerineh/open-kanban-board/",
              "_blank",
            )
          }
          className="cursor-pointer"
        >
          <Github className="mr-2 h-4 w-4" />
          <span>GitHub Repository</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
