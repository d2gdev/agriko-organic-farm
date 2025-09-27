// Type utilities and validation helpers

// Type guards for runtime safety
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

// Assertion functions
export function assertIsString(value: unknown, name = 'value'): asserts value is string {
  if (!isString(value)) {
    throw new TypeError(`Expected ${name} to be a string, got ${typeof value}`);
  }
}

export function assertIsNumber(value: unknown, name = 'value'): asserts value is number {
  if (!isNumber(value)) {
    throw new TypeError(`Expected ${name} to be a number, got ${typeof value}`);
  }
}

export function assertIsObject(value: unknown, name = 'value'): asserts value is Record<string, unknown> {
  if (!isObject(value)) {
    throw new TypeError(`Expected ${name} to be an object, got ${typeof value}`);
  }
}

// Safe property access
export function getProperty<T>(
  obj: Record<string, unknown>, 
  key: string, 
  defaultValue: T
): T {
  const value = obj[key];
  return value !== undefined ? value as T : defaultValue;
}

// Type-safe array access
export function getArrayItem<T>(
  array: T[], 
  index: number, 
  defaultValue?: T
): T | undefined {
  if (index < 0 || index >= array.length) {
    return defaultValue;
  }
  return array[index];
}

// Branded type creators
export function createProductId(id: number): ProductId {
  assertIsNumber(id, 'product ID');
  if (id <= 0) {
    throw new Error('Product ID must be positive');
  }
  return id as ProductId;
}

export function createUserId(id: string): UserId {
  assertIsString(id, 'user ID');
  if (id.trim().length === 0) {
    throw new Error('User ID cannot be empty');
  }
  return id.trim() as UserId;
}

export function createCategoryId(id: number): CategoryId {
  assertIsNumber(id, 'category ID');
  if (id <= 0) {
    throw new Error('Category ID must be positive');
  }
  return id as CategoryId;
}

// Type guards for branded types
export function isProductId(value: unknown): value is ProductId {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

export function isUserId(value: unknown): value is UserId {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

// Branded types for type safety
export type ProductId = number & { readonly __brand: 'ProductId' };
export type UserId = string & { readonly __brand: 'UserId' };
export type CategoryId = number & { readonly __brand: 'CategoryId' };

// Type-safe JSON parsing
export function parseJSON<T>(
  json: string, 
  validator: (value: unknown) => value is T
): T {
  try {
    const parsed: unknown = JSON.parse(json);
    if (validator(parsed)) {
      return parsed;
    }
    throw new Error('JSON validation failed');
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Environmental type helpers
export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

export function getEnvNumber(name: string, defaultValue?: number): number {
  const value = process.env[name];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Required environment variable ${name} is not set`);
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number, got: ${value}`);
  }
  return parsed;
}

export function getEnvBoolean(name: string, defaultValue?: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value.toLowerCase() === 'true';
}

// API response type validation
export function isApiResponse<T>(
  value: unknown,
  dataValidator: (data: unknown) => data is T
): value is { success: boolean; data?: T; error?: string } {
  if (!isObject(value)) return false;
  
  const { success, data, error } = value;
  
  if (!isBoolean(success)) return false;
  if (error !== undefined && !isString(error)) return false;
  if (data !== undefined && !dataValidator(data)) return false;
  
  return true;
}

// Exhaustive switch helper
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}

// Type-safe object keys
export function getTypedKeys<T extends Record<string, unknown>>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

// Safe property deletion
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T, 
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
}

// Safe property selection
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T, 
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}