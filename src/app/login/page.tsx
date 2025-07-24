"use client";
import Image from "next/image";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FullPageLoader } from "@/components/common/loader";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (error) {
      console.error("Error during Google sign-in:", error);
    }
  };

  if (loading || user) {
    return <FullPageLoader />;
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4 overflow-hidden">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem] dark:bg-background dark:bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)]">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,hsl(var(--primary)/0.1),transparent)]"></div>
      </div>
      <Card
        className={cn(
          "w-full max-w-md z-10 bg-card/80 backdrop-blur-sm border shadow-2xl transition-all duration-1000",
          isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        )}
      >
        <CardHeader className="text-center p-8">
          <div className="mx-auto flex items-center justify-center gap-3 mb-2">
            <Image
              src="/icon.svg"
              width={24}
              height={24}
              alt="OpenKanban icon"
            />
            <h1 className="text-4xl font-bold font-headline">OpenKanban</h1>
          </div>
          <CardTitle className="text-xl font-medium text-muted-foreground">
            Streamline Your Workflow
          </CardTitle>
          <CardDescription className="pt-2 max-w-sm mx-auto">
            The open-source Kanban board designed for clarity, collaboration,
            and getting things done.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6 p-8 pt-0">
          <div className="relative w-full aspect-square rounded-lg overflow-hidden">
            <Image
              src="/images/kanban_login_image.webp"
              alt="Kanban board illustration"
              fill
              className="object-cover"
              data-ai-hint="kanban board interface"
            />
          </div>

          <Button
            variant="default"
            size="lg"
            className="w-full text-sm bg-white hover:bg-white/90"
            onClick={handleGoogleLogin}
          >
            <svg
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2 h-5 w-5"
            >
              <title>Google</title>
              <path
                fill="#FFC107"
                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
              ></path>
              <path
                fill="#FF3D00"
                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
              ></path>
              <path
                fill="#4CAF50"
                d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
              ></path>
              <path
                fill="#1976D2"
                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.902,36.631,44,30.836,44,24C44,22.659,43.862,21.35,43.611,20.083z"
              ></path>
            </svg>
            Sign in to Get Started
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
