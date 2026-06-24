"use client";

import { useAuth } from "@/components/auth-provider";
import { ProjectsList } from "./projects-list";

export function HomeProjects() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto w-full pt-8 text-left">
      <h2 className="text-xl font-semibold mb-4">Your projects</h2>
      <ProjectsList />
    </div>
  );
}
