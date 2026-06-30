import { Artifact, UserConnection } from "@/generated/prisma";
import { ProviderManager } from "../connectors/ProviderManager";

export class SyncManager {
  /**
   * Syncs an artifact down from the external provider if it has changed.
   * Or syncs it up if the local version is newer.
   */
  public static async syncArtifact(connection: UserConnection, artifact: Artifact): Promise<void> {
    if (!connection || !artifact) {
      throw new Error("Connection and Artifact must be provided.");
    }
    
    // Convert Prisma enums to string for matching
    const providerId = connection.providerId;
    
    try {
      const provider = ProviderManager.getProvider(providerId);
      await provider.syncArtifact(connection, artifact);
    } catch (error) {
      console.error(`[SyncManager] Failed to sync artifact ${artifact.id} with provider ${providerId}:`, error);
      throw error;
    }
  }

  /**
   * Publishes a new artifact to the external provider.
   */
  public static async publishArtifact(connection: UserConnection, artifact: Artifact): Promise<{
    externalUrl: string;
    externalId?: string;
    fileUrls?: string;
  }> {
    if (!connection || !artifact) {
      throw new Error("Connection and Artifact must be provided.");
    }

    const providerId = connection.providerId;
    
    try {
      const provider = ProviderManager.getProvider(providerId);
      return await provider.publishArtifact(connection, artifact);
    } catch (error) {
      console.error(`[SyncManager] Failed to publish artifact ${artifact.id} with provider ${providerId}:`, error);
      throw error;
    }
  }
}
