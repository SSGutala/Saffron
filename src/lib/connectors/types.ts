import { Artifact, UserConnection } from "@/generated/prisma";

export interface ProviderAuthUrlResponse {
  url: string;
}

export interface ProviderTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes?: string;
  accountId?: string;
}

export interface IProviderConnector {
  /**
   * Return the URL to redirect the user to for OAuth authorization.
   */
  getAuthorizationUrl(state: string, redirectUri: string): string;

  /**
   * Exchange the authorization code for tokens.
   */
  exchangeCode(code: string, redirectUri: string): Promise<ProviderTokenResponse>;

  /**
   * Syncs an artifact down from the external provider if it has changed.
   * Or syncs it up if the local version is newer.
   */
  syncArtifact(connection: UserConnection, artifact: Artifact): Promise<void>;

  /**
   * Publishes a new artifact to the external provider and returns the external URL/ID.
   */
  publishArtifact(connection: UserConnection, artifact: Artifact): Promise<{
    externalUrl: string;
    externalId?: string;
    fileUrls?: string;
  }>;

  /**
   * Updates an existing artifact in the external provider.
   */
  updateArtifact?(connection: UserConnection, artifact: Artifact): Promise<void>;
}
