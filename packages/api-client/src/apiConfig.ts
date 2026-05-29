const DEFAULT_BASE_URL = 'http://localhost:8787';

let configuredBaseUrl: string | undefined;

/** Called from the app shell so env vars resolve in the app bundle, not api-client. */
export function configureApiClient(options: { baseUrl?: string }) {
  const trimmed = options.baseUrl?.trim();
  configuredBaseUrl = trimmed ? trimmed.replace(/\/$/, '') : undefined;
}

export function getApiBaseUrl(): string {
  if (configuredBaseUrl) return configuredBaseUrl;

  const fromEnv =
    typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_BASE_URL?.trim() : undefined;

  if (fromEnv) return fromEnv.replace(/\/$/, '');

  return DEFAULT_BASE_URL;
}
