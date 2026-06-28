"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";

const ProjectsList = () => {
  const trpc = useTRPC();
  const { data: projects } = useQuery(trpc.projects.getMany.queryOptions());

  return (
    <div className="w-full bg-white/90 dark:bg-zinc-900/80 backdrop-blur rounded-xl p-6 border border-white/20 flex flex-col gap-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {projects?.length === 0 && (
          <div className="col-span-full text-center">
            <p className="text-sm text-muted-foreground">
              No projects yet — build your first app above!
            </p>
          </div>
        )}
        {projects?.map((project) => (
          <Button
            key={project.id}
            variant="outline"
            className="font-normal h-auto justify-start w-full text-start p-4 bg-background/50"
            asChild
          >
            <Link href={`/projects/${project.id}`}>
              <div className="flex items-center gap-x-4">
                <Image src="/logo.svg" alt="Aria" width={32} height={32} />
                <div className="flex flex-col min-w-0">
                  <h3 className="truncate font-medium">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(project.updatedAt, { addSuffix: true })}
                  </p>
                </div>
              </div>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
};

export { ProjectsList };
