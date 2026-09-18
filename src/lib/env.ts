import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().default("HCM AI · PM"),
});

export const env = schema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
});
