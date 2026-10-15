import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const soloStartSchema = z.object({
  problem_id: z.string().uuid(),
});

export const soloSubmitSchema = z.object({
  session_id: z.string().uuid(),
  code: z.string().min(1),
});

export function parseBody(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const err = new Error(
      result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    );
    err.status = 400;
    throw err;
  }
  return result.data;
}
