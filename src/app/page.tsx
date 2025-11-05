"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { StickyNote, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, useUser, initiateAnonymousSignIn } from "@/firebase";

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (user) {
      router.push("/notes");
    }
  }, [user, router]);

  const handleSignIn = () => {
    initiateAnonymousSignIn(auth);
  };

  if (isUserLoading || user) {
    return (
      <div className="flex h-dvh w-full flex-col items-center justify-center bg-transparent">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center bg-transparent p-8 text-center">
      <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-6 rounded-2xl border border-white/20 bg-white/10 p-8 shadow-lg backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <StickyNote className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            QuickNote
          </h1>
        </div>
        <p className="text-muted-foreground">
          Your notes, everywhere. Sign in to access your notes securely on any
          device.
        </p>
        <Button onClick={handleSignIn} className="w-full max-w-xs">
          Sign In Anonymously
        </Button>
        <p className="text-xs text-muted-foreground">
          No account needed. Your notes are stored securely.
        </p>
      </div>
    </div>
  );
}
