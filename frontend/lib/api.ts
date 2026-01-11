/**
 * API Client Configuration
 *
 * This module provides a configured API client for communicating with the backend.
 * It handles common patterns like error handling, authentication headers, and base URL configuration.
 *
 * Usage:
 * ```typescript
 * import { api } from '@/lib/api';
 *
 * // GET request
 * const events = await api.get<Event[]>('/events');
 *
 * // POST request
 * const newEvent = await api.post<Event>('/events', { name: 'My Event' });
 * ```
 */

// Base URL for the API, configured via environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * API Error class for handling HTTP errors
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Configuration for API requests
 */
interface RequestConfig extends RequestInit {
  params?: Record<string, string>;
}

/**
 * Make an API request
 *
 * @param endpoint - API endpoint (e.g., '/events')
 * @param config - Request configuration
 * @returns Parsed JSON response
 */
async function request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
  const { params, ...init } = config;

  // Build URL with query parameters
  let url = `${API_BASE_URL}/api${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // Default headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...init.headers,
  };

  // TODO: Add authentication header when auth is implemented
  // const token = getAuthToken();
  // if (token) {
  //   headers['Authorization'] = `Bearer ${token}`;
  // }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  // Handle non-2xx responses
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.message || `HTTP error ${response.status}`,
      errorData.errors
    );
  }

  // Parse and return JSON response
  return response.json();
}

/**
 * API client with convenience methods
 */
export const api = {
  /**
   * GET request
   */
  get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    return request<T>(endpoint, { method: 'GET', params });
  },

  /**
   * POST request
   */
  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PUT request
   */
  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * DELETE request
   */
  delete<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'DELETE' });
  },
};

/**
 * Health check function
 *
 * Use this to verify backend connectivity.
 *
 * @returns Health status from the backend
 */
export async function checkHealth(): Promise<{
  status: string;
  timestamp: string;
  version: string;
}> {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
}
