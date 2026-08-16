import type { z as z4 } from "zod/v4";

export function toZodV4SchemaTyped<T extends z4.ZodTypeAny>(schema: T): T {
  return schema;
}
