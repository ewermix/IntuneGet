export type ErrorCategory = 'auth' | 'permission' | 'network' | 'server' | 'unknown';

interface CategorizedError {
  category: ErrorCategory;
  userMessage: string;
  actionLabel?: string;
  actionHref?: string;
}

export function categorizeError(error: unknown): CategorizedError {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  // Authentication errors
  if (
    lower.includes('not authenticated') ||
    lower.includes('token') ||
    lower.includes('sign in') ||
    lower.includes('unauthorized') ||
    lower.includes('401')
  ) {
    return {
      category: 'auth',
      userMessage: 'Your session has expired. Please sign in again.',
      actionLabel: 'Sign In',
      actionHref: '/auth/signin',
    };
  }

  // Permission errors
  if (
    lower.includes('consent') ||
    lower.includes('permission') ||
    lower.includes('forbidden') ||
    lower.includes('403') ||
    lower.includes('admin consent')
  ) {
    return {
      category: 'permission',
      userMessage: 'Missing required permissions. Please grant admin consent.',
      actionLabel: 'Grant Consent',
      actionHref: '/dashboard/settings?tab=permissions',
    };
  }

  // Network errors
  if (
    lower.includes('network') ||
    lower.includes('fetch') ||
    lower.includes('connection') ||
    lower.includes('timeout') ||
    lower.includes('econnrefused') ||
    lower.includes('dns')
  ) {
    return {
      category: 'network',
      userMessage: 'Unable to connect. Check your internet connection and try again.',
    };
  }

  // Server errors
  if (
    lower.includes('500') ||
    lower.includes('502') ||
    lower.includes('503') ||
    lower.includes('server error') ||
    lower.includes('internal error')
  ) {
    return {
      category: 'server',
      userMessage: 'A server error occurred. Please try again in a few moments.',
    };
  }

  return {
    category: 'unknown',
    userMessage: message || 'Something went wrong. Please try again.',
  };
}
