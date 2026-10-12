/**
 * INKFORGE — AUTH & API RATE LIMITER
 * High-performance sliding-window in-memory rate limiter with TTL eviction.
 * Protects authentication routes against credential stuffing, brute force,
 * and email enumeration attacks.
 */

import { TooManyRequestsError } from "../errors";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

export class SlidingWindowRateLimiter {
  private logs = new Map<string, number[]>();

  constructor(
    public readonly name: string,
    public readonly config: RateLimitConfig
  ) {}

  /**
   * Asserts that the key has not exceeded its request allocation.
   * Throws TooManyRequestsError (HTTP 429) if exceeded.
   */
  check(key: string, options?: { skipInTest?: boolean }): void {
    if (
      options?.skipInTest &&
      (process.env.NODE_ENV === "test" || process.env.INKFORGE_TEST_MODE === "true")
    ) {
      return;
    }

    const now = Date.now();

    // Prevent memory leaks: periodically evict expired keys if map grows beyond 2000 entries
    if (this.logs.size > 2000) {
      for (const [k, timestamps] of this.logs.entries()) {
        const active = timestamps.filter((t) => now - t < this.config.windowMs);
        if (active.length === 0) {
          this.logs.delete(k);
        } else {
          this.logs.set(k, active);
        }
      }
    }

    const timestamps = this.logs.get(key) || [];
    const validTimestamps = timestamps.filter((t) => now - t < this.config.windowMs);

    if (validTimestamps.length >= this.config.maxRequests) {
      const oldest = validTimestamps[0];
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((this.config.windowMs - (now - oldest)) / 1000)
      );
      throw new TooManyRequestsError(
        this.config.message ||
          `Too many requests to ${this.name}. Please wait ${retryAfterSeconds} second(s) before trying again.`,
        { retryAfterSeconds, endpoint: this.name }
      );
    }

    validTimestamps.push(now);
    this.logs.set(key, validTimestamps);
  }

  /**
   * Returns current count of valid timestamps for key.
   */
  getCount(key: string): number {
    const now = Date.now();
    const timestamps = this.logs.get(key) || [];
    return timestamps.filter((t) => now - t < this.config.windowMs).length;
  }

  /**
   * Clears state for a specific key or all keys.
   */
  reset(key?: string): void {
    if (key) {
      this.logs.delete(key);
    } else {
      this.logs.clear();
    }
  }
}

// 1. Login rate limiter: 15 attempts per minute per IP or identifier
export const loginRateLimiter = new SlidingWindowRateLimiter("login", {
  windowMs: 60 * 1000,
  maxRequests: 15,
  message: "Too many login attempts. Please wait a minute before trying again.",
});

// 2. Registration rate limiter: 10 attempts per minute per IP
export const registerRateLimiter = new SlidingWindowRateLimiter("registration", {
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: "Too many registration attempts. Please wait a minute before trying again.",
});

// 3. Password reset request rate limiter: 5 attempts per minute per IP / email
export const forgotPasswordRateLimiter = new SlidingWindowRateLimiter(
  "password reset",
  {
    windowMs: 60 * 1000,
    maxRequests: 5,
    message:
      "Too many password reset requests. Please wait a minute before requesting another link.",
  }
);
