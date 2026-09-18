import { z } from "zod";

/**
 * Environment schema for the HCM AI PM website.
 *
 * Phase 1 is a static-JSON site — there are no required env vars.
 * `NEXT_PUBLIC_APP_NAME` is optional and only controls the top-bar brand text.
 */
const schema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("HCM AI · PM"),
});

export const env = schema.parse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
});
