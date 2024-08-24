enum CacheErrors {
  InvalidKeyType = "invalid type of key-value to use this method!",
  OutOfIndex = "out-of array-index",
  InvalidKey = "invalid-key",
}

interface CachingOptions {
  TTL?: number;
}

type CacheData =
  | string
  | number
  | boolean
  | Buffer
  | Record<any, any>
  | Map<string, CacheData>
  | CacheData[];

export class LocalCache {
  private data: Map<
    string,
    { ttl: number; value: CacheData; timeout?: NodeJS.Timeout }
  > = new Map();
  private _TTL: number;

  constructor(options?: CachingOptions) {
    this._TTL = options?.TTL ?? 0;
  }

  /**
   * Set cache value.
   * @param {string} key - The caching key.
   * @param {CacheData} value - The caching value.
   * @param {number} [ttl=this._TTL] - Cache time-to-live in seconds.
   * @example
   * cache.set("users:sessions:x1c3c4", "id-1", 300);
   */
  public set(key: string, value: CacheData, ttl: number = this._TTL): void {
    this.data.set(key, { ttl, value, timeout: this.handleTTL(key, ttl) });
  }

  /**
   * Get cache value.
   * @param {string} key - The caching key.
   * @returns {CacheData | null} - The cached value or null if not found.
   * @example
   * cache.get("users:sessions:x1c3c4");
   */
  public get(key: string): CacheData | null {
    const data = this.data.get(key);
    return data ? data.value : null;
  }

  /**
   * Delete key from cache.
   * @param {...string} keys - The caching keys to delete.
   * @example
   * cache.del("users:sessions:x1c3c4");
   */
  public del(...keys: string[]): void {
    keys.forEach((key) => this.data.delete(key));
  }

  /**
   * Check if key exists in cache.
   * @param {string} key - The caching key.
   * @returns {boolean} - True if key exists, false otherwise.
   * @example
   * cache.exists("users:sessions:x1c3c4");
   */
  public exists(key: string): boolean {
    return this.data.has(key);
  }

  /**
   * Scan cache keys by a pattern.
   * @param {string} pattern - The scan pattern.
   * @returns {string[]} - Array of matching keys.
   * @example
   * cache.scan("users:*");
   */
  public scan(pattern: string): string[] {
    const regex = new RegExp(
      `^${pattern
        .replace(/([.*+?^${}()|\[\]\\])/g, "\\$1")
        .replace(/\\\*/g, ".*")}$`
    );
    return Array.from(this.data.keys()).filter((key) => regex.test(key));
  }

  /**
   * Get TTL of a cache key.
   * @param {string} key - The caching key.
   * @returns {number} - Time-to-live in seconds or -1 if not found.
   * @example
   * cache.getTTL("users:sessions:x1c3c4");
   */
  public getTTL(key: string): number {
    const data = this.data.get(key);
    return data ? data.ttl : -1;
  }

  /**
   * Set TTL of a cache key.
   * @param {string} key - The caching key.
   * @param {number} ttl - Time-to-live in seconds.
   * @example
   * cache.setTTL("users:sessions:x1c3c4", 300);
   */
  public setTTL(key: string, ttl: number): void {
    const data = this.data.get(key);
    if (!data) throw new Error("Invalid key");
    clearTimeout(data.timeout);
    data.ttl = ttl;
    data.timeout = this.handleTTL(key, ttl);
  }

  /**
   * Disable cache key expiration.
   * @param {string} key - The caching key.
   * @example
   * cache.persist("users:sessions:x1c3c4");
   */
  public persist(key: string): void {
    const data = this.data.get(key);
    if (!data) throw new Error("Invalid key");
    clearTimeout(data.timeout);
    data.ttl = 0; // Persist indefinitely
  }

  /**
   * Set fields in a hashmap.
   * @param {string} key - The caching key.
   * @param {Record<string, any>} object - The hashmap object.
   * @param {number} [ttl=this._TTL] - Cache key time-to-live.
   * @example
   * cache.hSet("users:1:sessions:1", { id: "1", secret: "fxl-rlf-fds" });
   */
  public hSet(
    key: string,
    object: Record<string, any>,
    ttl: number = this._TTL
  ): void {
    let data = this.data.get(key);
    if (!data || !(data.value instanceof Map)) {
      data = { ttl, timeout: this.handleTTL(key, ttl), value: new Map() };
      this.data.set(key, data);
    }
    Object.entries(object).forEach(([field, value]) => {
      (data.value as Map<string, any>).set(field, value);
    });
  }

  /**
   * Get a field from a hashmap.
   * @param {string} key - The caching key.
   * @param {string} field - The hashmap field.
   * @returns {CacheData | null} - The field value or null if not found.
   * @example
   * cache.hGet("users:1:sessions:1", "secret");
   */
  public hGet(key: string, field: string): CacheData | null {
    const data = this.data.get(key);
    if (!data || !(data.value instanceof Map)) return null;
    return (data.value as Map<string, any>).get(field) ?? null;
  }

  /**
   * Convert hashmap to a JavaScript object.
   * @param {string} key - The caching key.
   * @returns {Record<string, any> | null} - The hashmap as an object or null if not found.
   * @example
   * cache.hGetAll("users:1:sessions:1");
   */
  public hGetAll(key: string): Record<string, any> | null {
    const data = this.data.get(key);
    if (!data || !(data.value instanceof Map)) return null;
    return Object.fromEntries(data.value.entries());
  }

  /**
   * Delete a field from a hashmap.
   * @param {string} key - The caching key.
   * @param {string} field - The hashmap field.
   * @example
   * cache.hDel("users:1:sessions:1", "secret");
   */
  public hDel(key: string, field: string): void {
    const data = this.data.get(key);
    if (data && data.value instanceof Map) {
      (data.value as Map<string, any>).delete(field);
    }
  }

  /**
   * Check if a field exists in a hashmap.
   * @param {string} key - The caching key.
   * @param {string} field - The hashmap field.
   * @returns {boolean} - True if field exists, false otherwise.
   * @example
   * cache.hExists("users:1:sessions:1", "secret");
   */
  public hExists(key: string, field: string): boolean {
    const data = this.data.get(key);
    if (!data || !(data.value instanceof Map)) return false;
    return (data.value as Map<string, any>).has(field);
  }

  /**
   * Get the length of a hashmap.
   * @param {string} key - The caching key.
   * @returns {number} - The length of the hashmap.
   * @example
   * cache.hLen("users:1:sessions:1");
   */
  public hLen(key: string): number {
    const data = this.data.get(key);
    if (!data || !(data.value instanceof Map)) return 0;
    return data.value.size;
  }

  /**
   * Get all keys from a hashmap.
   * @param {string} key - The caching key.
   * @returns {string[]} - Array of keys.
   * @example
   * cache.hKeys("users:1:sessions:1");
   */
  public hKeys(key: string): string[] {
    const data = this.data.get(key);
    if (!data || !(data.value instanceof Map)) return [];
    return Array.from(data.value.keys());
  }

  /**
   * Get all values from a hashmap.
   * @param {string} key - The caching key.
   * @returns {CacheData[]} - Array of values.
   * @example
   * cache.hValues("users:1:sessions:1");
   */
  public hValues(key: string): CacheData[] {
    const data = this.data.get(key);
    if (!data || !(data.value instanceof Map)) return [];
    return Array.from(data.value.values());
  }

  /**
   * Add elements to a set.
   * @param {string} key - The caching key.
   * @param {CacheData[]} members - Elements to add.
   * @example
   * cache.sAdd("users:1:sessions:1", [1, 2, 3]);
   */
  public sAdd(key: string, members: CacheData[]): void {
    let data = this.data.get(key);
    if (!data || !(data.value instanceof Set)) {
      const timeout =
        this._TTL > 0
          ? setTimeout(() => this.data.delete(key), this._TTL * 1000)
          : undefined;
      data = { timeout, ttl: this._TTL, value: new Set() };
      this.data.set(key, data);
    }
    members.forEach((member) => (data.value as Set<CacheData>).add(member));
  }

  /**
   * Check if some element is in set
   * @param {string} key - caching key
   * @param {CacheData} member - element to check
   * @returns {boolean} - true if member exists, false otherwise
   * @example
   * cache.sIsMember("users:1:sessions:1", 3)
   */
  public sIsMember(key: string, member: CacheData): boolean {
    const data = this.data.get(key);
    if (!data || !(data.value instanceof Set)) return false;
    return (data.value as Set<CacheData>).has(member);
  }

  /**
   * Retrieves multiple values from the cache based on the provided keys.
   * @param keys - An array of caching keys to retrieve values for.
   * @returns An array of values corresponding to the keys, or null for missing keys.
   * @example
   * const values = cache.mGet("users:1:sessions:1", "users:1:sessions:2");
   */
  public mGet(...keys: string[]): (CacheData | null)[] {
    return keys.map((key) => this.data.get(key)?.value ?? null);
  }

  /**
   * Sets multiple key-value pairs in the cache.
   * @param object - An object containing key-value pairs to be cached.
   * @example
   * cache.mSet({ "key1": "value1", "key2": "value2" });
   */
  public mSet(object: Record<string, any>): void {
    for (const [key, value] of Object.entries(object)) {
      this.data.set(key, {
        ttl: 0,
        timeout: undefined,
        value: value,
      });
    }
  }

  /**
   * Increments the value of a specified key by a given amount.
   * @param key - The key of the value to increment.
   * @param value - The amount to increment the value by.
   * @throws {Error} Throws an error if the key is invalid or the value is not a number.
   * @example
   * cache.incrementBy("counter", 5);
   */
  public incrementBy(key: string, value: number): void {
    const data = this.data.get(key);
    if (!data || typeof data.value !== "number") {
      throw new Error(CacheErrors.InvalidKey);
    }
    data.value += value;
    this.data.set(key, data);
  }

  /**
   * Pushes multiple values onto the list stored at the specified key.
   * @param key - The key of the list to push values onto.
   * @param values - An array of values to push onto the list.
   * @example
   * cache.lPush("myList", [1, 2, 3]);
   */
  public lPush(key: string, values: CacheData[]): void {
    let data = this.data.get(key) || {
      ttl: this._TTL,
      timeout: this.handleTTL(key, this._TTL),
      value: [],
    };
    if (!Array.isArray(data.value)) {
      data.value = [];
    }
    data.value.push(...values);
    this.data.set(key, data);
  }

  /**
   * Pops the last value from the list stored at the specified key.
   * @param key - The key of the list to pop a value from.
   * @example
   * cache.lPop("myList");
   */
  public lPop(key: string): void {
    const data = this.data.get(key);
    if (data && Array.isArray(data.value)) {
      data.value.pop();
    }
  }

  /**
   * Retrieves a range of elements from the list stored at the specified key.
   * @param key - The key of the list.
   * @param start - The starting index of the range.
   * @param end - The ending index of the range.
   * @returns An array of elements in the specified range.
   * @throws {Error} Throws an error if the key is invalid or the value is not a list.
   * @example
   * const elements = cache.lRange("myList", 0, 2);
   */
  public lRange<T extends CacheData>(
    key: string,
    start: number,
    end: number
  ): T {
    const data = this.data.get(key);
    if (!data) throw new Error(CacheErrors.InvalidKey);
    if (!Array.isArray(data.value)) throw new Error(CacheErrors.InvalidKeyType);
    return data.value.slice(start, end) as T;
  }

  /**
   * Finds the index of a member in the list stored at the specified key.
   * @param key - The key of the list.
   * @param member - The member to find in the list.
   * @returns The index of the member, or -1 if not found.
   * @throws {Error} Throws an error if the key is invalid or the value is not a list.
   * @example
   * const index = cache.lPos("myList", 2);
   */
  public lPos(key: string, member: CacheData): number {
    const data = this.data.get(key);
    if (!data) throw new Error(CacheErrors.InvalidKey);
    if (!Array.isArray(data.value)) throw new Error(CacheErrors.InvalidKeyType);
    return data.value.indexOf(member);
  }

  /**
   * Retrieves the element at a specific index from the list stored at the specified key.
   * @param key - The key of the list.
   * @param index - The index of the element to retrieve.
   * @returns The element at the specified index, or null if not found.
   * @throws {Error} Throws an error if the key is invalid or the value is not a list.
   * @example
   * const element = cache.lIndex("myList", 1);
   */
  public lIndex(key: string, index: number): CacheData | null {
    const data = this.data.get(key);
    if (!data) throw new Error(CacheErrors.InvalidKey);
    if (!Array.isArray(data.value)) throw new Error(CacheErrors.InvalidKeyType);
    return data.value[index] ?? null;
  }

  /**
   * Retrieves the length of the list stored at the specified key.
   * @param key - The key of the list.
   * @returns The length of the list.
   * @throws {Error} Throws an error if the key is invalid or the value is not a list.
   * @example
   * const length = cache.lLen("myList");
   */
  public lLen(key: string): number {
    const data = this.data.get(key);
    if (!data) throw new Error(CacheErrors.InvalidKey);
    if (!Array.isArray(data.value)) throw new Error(CacheErrors.InvalidKeyType);
    return data.value.length;
  }

  /**
   * Sets the value at a specific index in the list stored at the specified key.
   * @param key - The key of the list.
   * @param index - The index at which to set the value.
   * @param value - The value to set at the specified index.
   * @throws {Error} Throws an error if the key is invalid, the value is not a list, or the index is out of bounds.
   * @example
   * cache.lSet("myList", 1, 5);
   */
  public lSet(key: string, index: number, value: CacheData): void {
    const data = this.data.get(key);
    if (!data) throw new Error(CacheErrors.InvalidKey);
    if (!Array.isArray(data.value)) throw new Error(CacheErrors.InvalidKeyType);
    if (index > data.value.length - 1) throw new Error(CacheErrors.OutOfIndex);
    data.value[index] = value;
    this.data.set(key, data);
  }

  /**
   * Removes all occurrences of a specified element from the list stored at the specified key.
   * @param key - The key of the list.
   * @param element - The element to remove from the list.
   * @throws {Error} Throws an error if the key is invalid or the value is not a list.
   * @example
   * cache.lRem("myList", 2);
   */
  public lRem(key: string, element: CacheData): void {
    const data = this.data.get(key);
    if (!data) throw new Error(CacheErrors.InvalidKey);
    if (!Array.isArray(data.value)) throw new Error(CacheErrors.InvalidKeyType);
    data.value = data.value.filter((el) => el !== element);
    this.data.set(key, data);
  }

  /**
   * Removes an element at a specific index from the list stored at the specified key.
   * @param key - The key of the list.
   * @param index - The index of the element to remove.
   * @throws {Error} Throws an error if the key is invalid, the value is not a list, or the index is out of bounds.
   * @example
   * cache.lRemIndex("myList", 0);
   */
  public lRemIndex(key: string, index: number): void {
    const data = this.data.get(key);
    if (!data) throw new Error(CacheErrors.InvalidKey);
    if (!Array.isArray(data.value)) throw new Error(CacheErrors.InvalidKeyType);
    if (index > data.value.length - 1) throw new Error(CacheErrors.OutOfIndex);
    data.value.splice(index, 1);
    this.data.set(key, data);
  }

  /**
   * Handles the time-to-live (TTL) for a specified key.
   * @param key - The key for which to handle TTL.
   * @param ttl - The time-to-live in seconds (default is the instance's TTL).
   * @returns A timeout ID if TTL is greater than 0, otherwise undefined.
   * @example
   * const timeoutId = cache.handleTTL("myKey", 60);
   */
  private handleTTL(
    key: string,
    ttl: number = this._TTL
  ): NodeJS.Timeout | undefined {
    if (ttl <= 0) return;
    return setTimeout(() => {
      this.del(key);
    }, ttl * 1000);
  }
}
