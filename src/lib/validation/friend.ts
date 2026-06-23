import { z } from "zod";

export const addFriendSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
});

export type AddFriendValues = z.infer<typeof addFriendSchema>;
