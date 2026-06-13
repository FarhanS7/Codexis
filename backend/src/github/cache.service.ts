import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  data: T;
  expiresAt: number; // Date.now() + ttlMs
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  // Map<key, { data, expiresAt }> — generic value type
  // 'unknown' forces explicit casting in get<T>() — prevents accidental type widening
  private readonly store = new Map<string, CacheEntry<unknown>>();

  /**
   * Retrieve a cached value by key.
   * Returns null if the key does not exist or has expired.
   * Lazy eviction: expired entries are deleted on read.
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    // Lazy eviction: check TTL on every read
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.logger.debug(`Cache EXPIRED and evicted: ${key}`);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Store a value in the cache with a TTL.
   * @param key   Cache key (use the namespace pattern: userId:resource)
   * @param data  Value to store
   * @param ttlMs Time-to-live in milliseconds
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
    this.logger.debug(`Cache SET: ${key} (TTL: ${ttlMs}ms)`);
  }

  /**
   * Explicitly delete a single cache entry.
   * Used when we know data is stale (e.g., after creating a new PR review).
   */
  delete(key: string): void {
    const deleted = this.store.delete(key);
    if (deleted) {
      this.logger.debug(`Cache DELETE: ${key}`);
    }
  }

  /**
   * Invalidate all cache entries whose keys start with the given prefix.
   * Used by the webhook handler (Task 8.1) to clear all PR-related cache
   * entries when a new commit is pushed to a PR branch.
   *
   * Example: invalidatePrefix("userId:owner/repo") clears:
   *   - "userId:owner/repo/pulls"
   *   - "userId:owner/repo/pulls/42"
   *   - "userId:owner/repo/pulls/43"
   */
  invalidatePrefix(prefix: string): void {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    if (count > 0) {
      this.logger.debug(
        `Cache INVALIDATED ${count} entries with prefix: "${prefix}"`,
      );
    }
  }

  /**
   * Wipe all cache entries. Used in unit tests to ensure clean state.
   * Not intended for production use.
   */
  clear(): void {
    const size = this.store.size;
    this.store.clear();
    this.logger.debug(`Cache CLEARED — removed ${size} entries`);
  }

  /**
   * Returns cache statistics for the health endpoint (Task 8.1).
   * Note: keys may include expired entries that haven't been lazily evicted yet.
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.store.size,
      keys: [...this.store.keys()],
    };
  }
}
