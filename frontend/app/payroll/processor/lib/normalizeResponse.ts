// typescript
// File: `app/payroll/processor/lib/normalizeResponse.ts`
export type UnknownRecord = Record<string, unknown>

const isObject = (v: unknown): v is UnknownRecord =>
  v !== null && typeof v === 'object'

export function normalizeResponse<T = UnknownRecord>(parsed: unknown): T[] {
  if (Array.isArray(parsed)) return parsed as unknown as T[]
  if (!isObject(parsed)) return []

  const obj = parsed as UnknownRecord
  const candidates = ['sites', 'tasks', 'data', 'results', 'rows', 'items', 'payload']

  for (const k of candidates) {
    const val = obj[k]
    if (Array.isArray(val)) return val as unknown as T[]
    if (isObject(val)) {
      const nested = val as UnknownRecord
      if (Array.isArray(nested.data)) return nested.data as unknown as T[]
      if (Array.isArray(nested.results)) return nested.results as unknown as T[]
    }
  }

  // Fallback: return the first property that is an array (helps with unexpected key names)
  for (const key of Object.keys(obj)) {
    const val = obj[key]
    if (Array.isArray(val)) return val as unknown as T[]
  }

  // Extra safety for nested `data` shapes
  if (isObject(obj.data)) {
    const maybe = obj.data as UnknownRecord
    if (Array.isArray(maybe.rows)) return maybe.rows as unknown as T[]
    if (Array.isArray(maybe.data)) return maybe.data as unknown as T[]
  }

  return []
}
