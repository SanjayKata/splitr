import { z } from "zod";

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(60, "Name is too long"),
  defaultCurrency: z.string().length(3, "Pick a currency"),
});

export type ProfileValues = z.infer<typeof profileSchema>;
