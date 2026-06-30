import { IProviderConnector } from "./types";
import { GoogleWorkspaceProvider } from "./providers/google-workspace";

export class ProviderManager {
  private static providers: Record<string, IProviderConnector> = {
    google: new GoogleWorkspaceProvider(),
    // Future providers will be registered here
    // microsoft: new Microsoft365Provider(),
    // atlassian: new AtlassianProvider(),
  };

  /**
   * Retrieves a provider instance by its ID.
   */
  public static getProvider(providerId: string): IProviderConnector {
    const provider = this.providers[providerId];
    if (!provider) {
      throw new Error(`Provider ${providerId} is not supported or not implemented yet.`);
    }
    return provider;
  }
}
