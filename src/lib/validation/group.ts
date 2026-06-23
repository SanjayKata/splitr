import { z } from "zod";

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Group name is required")
    .max(80, "Name is too long"),
  currency: z.string().length(3, "Pick a currency"),
});

export const addMemberSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
});

export type CreateGroupValues = z.infer<typeof createGroupSchema>;
export type AddMemberValues = z.infer<typeof addMemberSchema>;
