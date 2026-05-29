import { getApiBaseUrl } from './apiConfig';

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`API error ${status}`);
    this.name = 'ApiClientError';
  }
}

export const customFetch = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const baseUrl = getApiBaseUrl();
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ApiClientError(response.status, errorBody);
  }

  if (response.status === 204) {
    return {
      data: undefined,
      status: 204,
      headers: response.headers,
    } as T;
  }

  const data = await response.json();

  return {
    data,
    status: response.status,
    headers: response.headers,
  } as T;
};

export type ErrorType<Error = ApiClientError> = Error;

export type BodyType<BodyData> = BodyData;
