"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { StickyNote, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth, useUser, initiateEmailSignIn, initiateEmailSignUp } from "@/firebase";

const authSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type AuthFormValues = z.infer<typeof authSchema>;

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isSignUp, setIsSignUp] = useState(false);

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (user) {
      router.push("/notes");
    }
  }, [user, router]);
  
  const onSubmit = (data: AuthFormValues) => {
    if (isSignUp) {
      initiateEmailSignUp(auth, data.email, data.password);
    } else {
      initiateEmailSignIn(auth, data.email, data.password);
    }
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
    <div className="flex h-dvh w-full flex-col items-center justify-center bg-transparent p-4">
      <Card className="w-full max-w-sm border-white/20 bg-white/10 shadow-lg backdrop-blur-lg">
        <CardHeader className="text-center">
          <div className="mx-auto flex w-full flex-col items-center justify-center gap-2">
            <StickyNote className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold tracking-tight text-foreground">QuickNote</CardTitle>
          </div>
          <CardDescription>
            {isSignUp ? "Create an account to start saving notes." : "Sign in to access your notes."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                {isSignUp ? "Create Account" : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" onClick={() => {
              setIsSignUp(!isSignUp);
              form.reset();
            }}>
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
