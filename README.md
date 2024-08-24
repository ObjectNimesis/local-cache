## LocalCache

The `LocalCache` class is an in-memory cache implementation that provides a simple and efficient way to store and retrieve key-value pairs. It supports various data structures such as strings, numbers, booleans, buffers, objects, sets, maps, and arrays. The cache supports time-to-live (TTL) for expiring keys and provides methods for setting, getting, deleting, and scanning keys.

### Installation

To use the `LocalCache` class, you need to have Node.js installed. You can install it using npm:

NPM

```bash
npm install @objectnimesis-inc/local-cache
```

Yarn

```bash
yarn add @objectnimesis-inc/local-cache
```

### Usage

Here's an example of how to use the `LocalCache` class:

```javascript
import { LocalCache } from '@objectnimesis-inc/local-cache';

const cache = new LocalCache({ TTL: 300 }); // Set default TTL to 5 minutes

cache.set('users:sessions:x1c3c4', 'id-1', 300); // Set a key with a TTL of 300 seconds
const value = cache.get('users:sessions:x1c3c4'); // Get the value of a key
console.log(value); // Output: 'id-1'

cache.del('users:sessions:x1c3c4'); // Delete a key
console.log(cache.exists('users:sessions:x1c3c4')); // Output: false

const keys = cache.scan('users:*'); // Scan keys by a pattern
console.log(keys); // Output: ['users:sessions:x1c3c4']
```

### API

The `LocalCache` class provides the following methods:

- `set(key, value, ttl)`: Sets a key-value pair with an optional TTL.
- `get(key)`: Retrieves the value of a key.
- `del(...keys)`: Deletes one or more keys.
- `exists(key)`: Checks if a key exists in the cache.
- `scan(pattern)`: Scans keys by a pattern.
- `getTTL(key)`: Gets the TTL of a key.
- `setTTL(key, ttl)`: Sets the TTL of a key.
- `persist(key)`: Disables the expiration of a key.
- `hSet(key, object, ttl)`: Sets fields in a hashmap.
- `hGet(key, field)`: Gets a field from a hashmap.
- `hGetAll(key)`: Converts a hashmap to a JavaScript object.
- `hDel(key, field)`: Deletes a field from a hashmap.
- `hExists(key, field)`: Checks if a field exists in a hashmap.
- `hLen(key)`: Gets the length of a hashmap.
- `hKeys(key)`: Gets all keys from a hashmap.
- `hValues(key)`: Gets all values from a hashmap.
- `sAdd(key, members)`: Adds elements to a set.
- `sIsMember(key, member)`: Checks if an element is in a set.
- `mGet(...keys)`: Retrieves multiple values from the cache based on the provided keys.
- `mSet(object)`: Sets multiple key-value pairs in the cache.
- `incrementBy(key, value)`: Increments the value of a key by a given amount.
- `lPush(key, values)`: Pushes multiple values onto a list.
- `lPop(key)`: Pops the last value from a list.
- `lRange(key, start, end)`: Retrieves a range of elements from a list.
- `lPos(key, member)`: Finds the index of a member in a list.
- `lIndex(key, index)`: Retrieves the element at a specific index from a list.
- `lLen(key)`: Retrieves the length of a list.
- `lSet(key, index, value)`: Sets the value at a specific index in a list.
- `lRem(key, element)`: Removes all occurrences of an element from a list.

### Caching Options

The `LocalCache` class accepts an optional `CachingOptions` object during initialization:

```typescript
interface CachingOptions {
  TTL?: number;
}
```

- `TTL`: The default time-to-live (TTL) for keys in seconds. If not specified, the default value is `0` (no expiration).

### Data Types

The `LocalCache` class supports the following data types for values:

- `string`
- `number`
- `boolean`
- `Buffer`
- `Record`
- `Map`
- `CacheData[]` (array of `CacheData`)

### Errors

The `LocalCache` class throws the following errors:

- `InvalidKeyType`: Thrown when an invalid type of key-value is used for a method.
- `OutOfIndex`: Thrown when an index is out of array bounds.
- `InvalidKey`: Thrown when an invalid key is used for a method.

### Limitations

- The `LocalCache` class is an in-memory cache, so the cache data will be lost when the application is restarted or the process is terminated.
- The maximum size of the cache is limited by the available memory of the system running the application.

### License

The `LocalCache` class is licensed under the MIT License.

