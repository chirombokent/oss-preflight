export class AiConfigError extends Error {
  readonly name = 'AiConfigError';

  constructor(message: string) {
    super(message);
  }
}

export function isAiConfigError(error: unknown): error is AiConfigError {
  return error instanceof AiConfigError || (error as Error)?.name === 'AiConfigError';
}

