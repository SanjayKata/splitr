import { z } from "zod";

// Amount is kept as a string in the form (inputs are strings) and parsed on
// submit. A regex validates "up to 2 decimal places" without floating-point
// rounding surprises.
const amountField = z
  .string()
  .trim()
  .min(1, "Enter an amount")
  .refine(
    (v) => /^\d+(\.\d{1,2})?$/.test(v),
    "Enter a valid amount (up to 2 decimals)",
  )
  .refine((v) => Number(v) > 0, "Amount must be greater than 0");

export const addExpenseSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(120, "Description is too long"),
  amount: amountField,
  paidBy: z.string().min(1, "Choose who paid"),
  category: z.string().trim().max(40).optional().or(z.literal("")),
  participantIds: z
    .array(z.string())
    .min(1, "Select at least one person to split between"),
});

export type AddExpenseValues = z.infer<typeof addExpenseSchema>;
