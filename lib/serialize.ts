export type Json =
  | null
  | string
  | number
  | boolean
  | { [k: string]: Json }
  | Json[];

export function toJSON<T>(value: T): Json {
  return JSON.parse(
    JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? v.toString() : v)),
  ) as Json;
}
