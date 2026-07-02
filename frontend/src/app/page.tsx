"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";

export default function Home() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link className="flex items-center justify-center" href="/">
          <span className="font-bold text-xl tracking-tight">Zalo AI SaaS</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#features"
          >
            Features
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#pricing"
          >
            Pricing
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Supercharge your Zalo Customer Support
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  AI-powered auto-replies, smart inbox management, and CRM tailored specifically for your Zalo Official Account.
                </p>
              </div>
              <div className="space-x-4">
                {isAuthenticated ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="px-8">
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login">
                      <Button size="lg" className="px-8">
                        Login
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button size="lg" variant="secondary" className="px-8">
                        Register
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Zalo AI SaaS MVP. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
