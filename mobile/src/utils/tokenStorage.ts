// Token storage abstraction
// In React Native CLI production this uses react-native-keychain or MMKV.
// We provide a safe in-memory fallback layer to guarantee smooth runtime anywhere.

interface StoredTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

let memoryStorage: StoredTokens = {
  accessToken: null,
  refreshToken: null,
};

export const tokenStorage = {
  async getTokens(): Promise<StoredTokens> {
    return { ...memoryStorage };
  },

  async setTokens(tokens: { accessToken: string; refreshToken: string }): Promise<void> {
    memoryStorage.accessToken = tokens.accessToken;
    memoryStorage.refreshToken = tokens.refreshToken;
  },

  async setAccessToken(accessToken: string): Promise<void> {
    memoryStorage.accessToken = accessToken;
  },

  async clearTokens(): Promise<void> {
    memoryStorage.accessToken = null;
    memoryStorage.refreshToken = null;
  },
};
