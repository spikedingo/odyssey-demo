/** Unwrap Orval fetch response envelope to the API payload. */
export function unwrap<T>(response: unknown): T | undefined {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return undefined;
}
