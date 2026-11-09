/** Resolve local URLs once; preserve external URLs, tokens, queries and fragments. */
export function withBase(path: string, base = import.meta.env?.BASE_URL ?? '/') {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  const prefix = '/' + base.replace(/^\/+|\/+$/g, '');
  if (prefix === '/' || path === prefix || path.startsWith(prefix + '/')) return path;
  return prefix + path;
}

/** Resolve asset URLs before serialising config into browser payloads. */
export function resolveAssets<T>(value: T): T {
  if (typeof value === 'string') return withBase(value) as T;
  if (Array.isArray(value)) return value.map(resolveAssets) as T;
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveAssets(v)])) as T;
  return value;
}
