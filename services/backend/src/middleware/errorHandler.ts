export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function formatErrorResponse(error: ApiError) {
  return {
    error: error.code,
    message: error.message,
    ...(error.details !== undefined ? { details: error.details } : {}),
  };
}
