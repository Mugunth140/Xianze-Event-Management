// API utility for making requests to backend
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
const API_URL = `${API_BASE}/api`;

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Error types for better handling
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Rate limit tracker
const rateLimitTracker = {
  lastRequest: 0,
  minInterval: 100, // Minimum 100ms between requests
};

// Check if error is retryable
function isRetryableError(status: number): boolean {
  return status === 429 || status === 503 || status === 502 || status === 504 || status === 0;
}

// Delay helper with exponential backoff
function delay(attempt: number): Promise<void> {
  const ms = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
  return new Promise((resolve) => setTimeout(resolve, Math.min(ms, 10000)));
}

// Create AbortController with timeout
function createTimeoutController(timeout: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller;
}

// Rate limit check
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - rateLimitTracker.lastRequest;
  if (elapsed < rateLimitTracker.minInterval) {
    await new Promise((resolve) =>
      setTimeout(resolve, rateLimitTracker.minInterval - elapsed)
    );
  }
  rateLimitTracker.lastRequest = Date.now();
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retries: number = MAX_RETRIES
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  // Ensure endpoint starts with / for consistency
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_URL}${normalizedEndpoint}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Rate limit protection
      await waitForRateLimit();

      // Create timeout controller
      const controller = createTimeoutController(REQUEST_TIMEOUT);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        // Handle 401 globally
        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/admin/login';
          }
          throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED', false);
        }

        // Check if retryable
        if (isRetryableError(response.status) && attempt < retries) {
          await delay(attempt);
          continue;
        }

        const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new ApiError(
          errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData.code,
          isRetryableError(response.status)
        );
      }

      return response.json();
    } catch (error) {
      lastError = error as Error;

      // Handle abort/timeout
      if (error instanceof DOMException && error.name === 'AbortError') {
        if (attempt < retries) {
          await delay(attempt);
          continue;
        }
        throw new ApiError('Request timed out', 0, 'TIMEOUT', true);
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (attempt < retries) {
          await delay(attempt);
          continue;
        }
        throw new ApiError('Network error. Please check your connection.', 0, 'NETWORK_ERROR', true);
      }

      // Re-throw ApiErrors
      if (error instanceof ApiError) {
        throw error;
      }

      // Unknown errors
      if (attempt < retries) {
        await delay(attempt);
        continue;
      }
    }
  }

  throw lastError || new ApiError('Request failed after retries', 0, 'MAX_RETRIES', false);
}

// Fetch with retry for FormData (no Content-Type header)
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await waitForRateLimit();

      const controller = createTimeoutController(REQUEST_TIMEOUT);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      // Return response even if not ok - let caller handle status
      if (response.ok || !isRetryableError(response.status)) {
        return response;
      }

      // Retryable error
      if (attempt < retries) {
        await delay(attempt);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      if (error instanceof DOMException && error.name === 'AbortError') {
        if (attempt < retries) {
          await delay(attempt);
          continue;
        }
        throw new ApiError('Request timed out. Please try again.', 0, 'TIMEOUT', true);
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (attempt < retries) {
          await delay(attempt);
          continue;
        }
        throw new ApiError('Network error. Please check your connection.', 0, 'NETWORK_ERROR', true);
      }

      if (attempt < retries) {
        await delay(attempt);
        continue;
      }
    }
  }

  throw lastError || new ApiError('Request failed after retries', 0, 'MAX_RETRIES', false);
}

// Debounce helper for form submissions
export function createSubmitDebounce(delayMs: number = 2000): () => boolean {
  let lastSubmit = 0;
  return () => {
    const now = Date.now();
    if (now - lastSubmit < delayMs) {
      return false; // Too soon, reject
    }
    lastSubmit = now;
    return true; // Allow submission
  };
}

export function getApiUrl(endpoint: string): string {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_URL}${normalizedEndpoint}`;
}

export { API_URL };
