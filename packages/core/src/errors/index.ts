export class HeliosError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'HeliosError';
  }
}

export class ProviderError extends HeliosError {
  constructor(provider: string, message: string, context?: Record<string, unknown>) {
    super(message, `PROVIDER_${provider.toUpperCase()}_ERROR`, { provider, ...context });
    this.name = 'ProviderError';
  }
}

export class ConfigurationError extends HeliosError {
  constructor(message: string, field?: string) {
    super(message, 'CONFIGURATION_ERROR', { field });
    this.name = 'ConfigurationError';
  }
}

export class AuthenticationError extends HeliosError {
  constructor(provider: string, message: string) {
    super(message, 'AUTHENTICATION_ERROR', { provider });
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends HeliosError {
  constructor(provider: string, retryAfterSeconds?: number) {
    super(`Rate limit exceeded for provider: ${provider}`, 'RATE_LIMIT_ERROR', {
      provider,
      retryAfterSeconds,
    });
    this.name = 'RateLimitError';
  }
}

export class StateError extends HeliosError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'STATE_ERROR', context);
    this.name = 'StateError';
  }
}

export class PolicyError extends HeliosError {
  constructor(message: string, ruleId?: string) {
    super(message, 'POLICY_ERROR', { ruleId });
    this.name = 'PolicyError';
  }
}
