import { Artifact, UserConnection } from "@prisma/client";
import { IProviderConnector, ProviderTokenResponse } from "../types";

export class GoogleWorkspaceProvider implements IProviderConnector {
  private clientId = process.env.GOOGLE_CLIENT_ID!;
  private clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  
  getAuthorizationUrl(state: string, redirectUri: string): string {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    // Request scopes for Drive, Docs, Sheets, and Slides
    url.searchParams.set("scope", "openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/presentations");
    url.searchParams.set("access_type", "offline"); // Get refresh token
    url.searchParams.set("state", state);
    url.searchParams.set("prompt", "consent"); // Force consent to ensure refresh token is returned
    
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

    const data = await tokenRes.json();
    if (!tokenRes.ok) {
      throw new Error(`Google OAuth exchange failed: ${JSON.stringify(data)}`);
    }

    // Attempt to get user identity to link account ID
    let accountId = undefined;
    try {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
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
    // Basic implementation for MVP synchronization
    if (!artifact.externalUrl || !artifact.connectorExternalUrl) {
      return; // Nothing to sync yet
    }
    
    // In a full implementation, we would diff the external file and internal state
    // For MVP, we will assume this is a scaffold that will be expanded.
    console.log(`[GoogleWorkspaceProvider] Syncing artifact ${artifact.id} for connection ${connection.id}`);
  }

  async publishArtifact(connection: UserConnection, artifact: Artifact): Promise<{
    externalUrl: string;
    externalId?: string;
    fileUrls?: string;
  }> {
    console.log(`[GoogleWorkspaceProvider] Publishing artifact ${artifact.id} for connection ${connection.id}`);
    
    // Create a new Google Doc
    const res = await fetch("https://docs.googleapis.com/v1/documents", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${connection.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: artifact.title || "Untitled Document",
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Failed to create Google Doc: ${JSON.stringify(data)}`);
    }

    const documentId = data.documentId;
    const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;

    return {
      externalUrl: documentUrl,
      externalId: documentId,
    };
  }
}
