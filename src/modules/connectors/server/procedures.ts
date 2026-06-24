import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { connectArtifactToProvider } from "@/lib/connectors/registry";
import type { ConnectorProviderId } from "@/lib/connectors/types";
import { withAutofix } from "@/lib/autofix";
import prisma from "@/lib/prisma";
import type { ArtifactContent } from "@/types/artifacts";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { ConnectorProvider } from "@/generated/prisma";

function parseContent(raw: string): ArtifactContent {
  try {
    return JSON.parse(raw) as ArtifactContent;
  } catch {
    return {};
  }
}

export const connectorsRouter = createTRPCRouter({
  listAccounts: protectedProcedure.query(async ({ ctx }) => {
    return prisma.connectorAccount.findMany({
      where: { userId: ctx.auth.userId },
      select: {
        id: true,
        provider: true,
        accountLabel: true,
        expiresAt: true,
        updatedAt: true,
      },
    });
  }),

  connectArtifact: protectedProcedure
    .input(
      z.object({
        artifactId: z.string(),
        provider: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const artifact = await prisma.artifact.findFirst({
        where: { id: input.artifactId, userId: ctx.auth.userId },
      });
      if (!artifact) throw new TRPCError({ code: "NOT_FOUND" });

      const provider = input.provider as ConnectorProviderId;
      const content = parseContent(artifact.content);

      const account = await prisma.connectorAccount.findUnique({
        where: {
          userId_provider: { userId: ctx.auth.userId, provider: provider as ConnectorProvider },
        },
      });

      if (!account) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Connect your ${provider.replace(/_/g, " ")} account first (Settings → Connectors).`,
        });
      }

      const result = await withAutofix(
        {
          kind: "connector_load",
          operation: "connectArtifact",
          artifactId: artifact.id,
        },
        async () =>
          connectArtifactToProvider({
            provider,
            accessToken: account.accessToken,
            title: artifact.title,
            content,
            artifactKind: artifact.kind,
            existingExternalId: artifact.connectorExternalId,
          }),
      );

      if (!result.ok) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.userMessage });
      }

      const meta = result.value;
      return prisma.artifact.update({
        where: { id: artifact.id },
        data: {
          connectorProvider: provider as ConnectorProvider,
          connectorExternalId: meta.externalId,
          connectorEmbedUrl: meta.embedUrl,
          connectorExternalUrl: meta.openUrl,
        },
      });
    }),

  /** Store OAuth token after callback (stub until full OAuth routes wired). */
  saveAccount: protectedProcedure
    .input(
      z.object({
        provider: z.string(),
        accessToken: z.string(),
        refreshToken: z.string().optional(),
        accountLabel: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return prisma.connectorAccount.upsert({
        where: {
          userId_provider: {
            userId: ctx.auth.userId,
            provider: input.provider as ConnectorProvider,
          },
        },
        create: {
          userId: ctx.auth.userId,
          provider: input.provider as ConnectorProvider,
          accessToken: input.accessToken,
          refreshToken: input.refreshToken,
          accountLabel: input.accountLabel,
        },
        update: {
          accessToken: input.accessToken,
          refreshToken: input.refreshToken,
          accountLabel: input.accountLabel,
        },
      });
    }),
});
