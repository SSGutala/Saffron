import type { Artifact, UserConnection } from "@/generated/prisma";
import type { IProviderConnector, ProviderTokenResponse } from "../types";
import type { ArtifactContent } from "@/types/artifacts";
import {
  getOrCreateProductFolder,
  createGoogleDoc,
  createGoogleSheet,
  updateGoogleDoc,
  updateGoogleSheet,
  refreshFileMetadata,
  resolveGoogleFileType,
} from "@/lib/google/google-drive-publisher";
import prisma from "@/lib/prisma";

function parseContent(raw: string): ArtifactContent {
  try {
    return JSON.parse(raw) as ArtifactContent;
  } catch {
    return {};
  }
}

export class GoogleWorkspaceProvider implements IProviderConnector {
  private get clientId() {
    return process.env.GOOGLE_WORKSPACE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID!;
  }

  private get clientSecret() {
    return process.env.GOOGLE_WORKSPACE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET!;
  }

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set(
      "scope",
      [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/documents",
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/presentations",
      ].join(" "),
    );
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("state", state);
    url.searchParams.set("prompt", "consent");
    return url.toString();
  }

  async exchangeCode(code: string, redirectUri: string): Promise<ProviderTokenResponse> {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const data = await tokenRes.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
    };
    if (!tokenRes.ok) {
      throw new Error(`Google OAuth exchange failed: ${JSON.stringify(data)}`);
    }

    let accountId: string | undefined;
    try {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (userRes.ok) {
        const userData = await userRes.json() as { email?: string };
        accountId = userData.email;
      }
    } catch (e) {
      console.error("[GoogleWorkspaceProvider] Failed to fetch userinfo during token exchange", e);
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
      scopes: data.scope,
      accountId,
    };
  }

  async syncArtifact(connection: UserConnection, artifact: Artifact): Promise<void> {
    if (!artifact.externalFileId) return;

    try {
      const meta = await refreshFileMetadata(connection, artifact.externalFileId);
      await prisma.artifact.update({
        where: { id: artifact.id },
        data: {
          lastSyncedAt: new Date(),
          lastExternalModifiedAt: new Date(meta.lastModified),
          sourceStatus: "synced",
          syncError: null,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sync failed";
      await prisma.artifact.update({
        where: { id: artifact.id },
        data: {
          sourceStatus: "sync_error",
          syncError: msg,
        },
      });
      throw err;
    }
  }

  async publishArtifact(
    connection: UserConnection,
    artifact: Artifact,
    productName?: string,
  ): Promise<{
    externalUrl: string;
    externalId?: string;
    fileUrls?: string;
    embedUrl?: string;
    folderId?: string;
  }> {
    const content = parseContent(artifact.content);
    const fileType = resolveGoogleFileType(artifact);
    const name = productName ?? "Product";

    // Get or create the product Drive folder
    const folder = await getOrCreateProductFolder(
      connection,
      name,
      artifact.externalFolderId,
    );

    let result: { fileId: string; fileUrl: string; embedUrl: string };

    if (fileType === "sheet") {
      result = await createGoogleSheet(connection, folder.folderId, artifact, content);
    } else {
      result = await createGoogleDoc(connection, folder.folderId, artifact, content);
    }

    return {
      externalUrl: result.fileUrl,
      externalId: result.fileId,
      embedUrl: result.embedUrl,
      folderId: folder.folderId,
    };
  }

  async updateArtifact(connection: UserConnection, artifact: Artifact): Promise<void> {
    if (!artifact.externalFileId) {
      throw new Error("Artifact has no external file ID");
    }
    const content = parseContent(artifact.content);
    const fileType = resolveGoogleFileType(artifact);

    if (fileType === "sheet") {
      await updateGoogleSheet(connection, artifact.externalFileId, artifact, content);
    } else {
      await updateGoogleDoc(connection, artifact.externalFileId, artifact, content);
    }
    await this.syncArtifact(connection, artifact);
  }
}
