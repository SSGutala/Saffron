import { artifactsRouter } from "@/modules/artifacts/server/procedures";
import { lifecycleRouter } from "@/modules/lifecycle/server/procedures";
import { messagesRouter } from "@/modules/messages/server/procedures";
import { projectsRouter } from "@/modules/projects/server/procedures";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  artifacts: artifactsRouter,
  lifecycle: lifecycleRouter,
  messages: messagesRouter,
  projects: projectsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
