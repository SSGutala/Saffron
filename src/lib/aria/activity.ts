import prisma from "@/lib/prisma";

export async function logProductActivity({
  projectId,
  eventType,
  title,
  metadata,
}: {
  projectId: string;
  eventType: string;
  title: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.activityEvent.create({
    data: {
      projectId,
      eventType,
      title,
      metadataJson: metadata ? JSON.stringify(metadata) : undefined,
    },
  });
}
