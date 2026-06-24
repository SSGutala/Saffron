"use client";

import Link from "next/link";
import { LogOutIcon, UserIcon } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserControlProps {
  showName?: boolean;
}

const UserControl = ({ showName }: UserControlProps) => {
  const { user, signOut } = useAuth();

  if (!user) return null;

  const label = user.name || user.email.split("@")[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-full">
          <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center">
            <UserIcon className="size-3.5 text-primary" />
          </div>
          {showName && <span className="max-w-[120px] truncate">{label}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          <p className="text-xs text-primary mt-1 capitalize">{user.plan.toLowerCase()} plan</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/pricing">Upgrade</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void signOut()}>
          <LogOutIcon className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { UserControl };
