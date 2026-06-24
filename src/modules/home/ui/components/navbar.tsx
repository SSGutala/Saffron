"use client";

import Link from "next/link";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { UserControl } from "@/components/user-control";
import { useScroll } from "@/hooks/use-scroll";
import { cn } from "@/lib/utils";
import Image from "next/image";

const Navbar = () => {
  const scrolled = useScroll();
  const { user, loading } = useAuth();

  return (
    <nav
      className={cn(
        "p-4 bg-transparent fixed top-0 left-0 right-0 z-50 transition-all duration-200 border-b border-transparent",
        scrolled && "bg-background/80 backdrop-blur-md border-border",
      )}
    >
      <div className="max-w-6xl mx-auto w-full flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Saffron" width={28} height={28} />
          <span className="font-semibold text-lg tracking-tight">Saffron</span>
        </Link>
        {!loading && !user && (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sign-in">Log in</Link>
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5"
              asChild
            >
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>
        )}
        {user && <UserControl showName />}
      </div>
    </nav>
  );
};

export { Navbar };
