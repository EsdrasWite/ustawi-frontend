import { z } from "zod";

export const expenseRecipientSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("internal"), memberId: z.string().min(1, "Choisissez un membre"), name: z.string().trim().min(1) }),
  z.object({ kind: z.literal("external"), name: z.string().trim().min(1, "Destinataire externe requis").max(200, "200 caractères maximum") }),
]);
export type ExpenseRecipient = z.infer<typeof expenseRecipientSchema>;
export type RecipientFilter = "all" | ExpenseRecipient["kind"];
type WithRecipient = { recipient?: ExpenseRecipient };
export function matchesRecipient(expense: WithRecipient, filter: RecipientFilter) {
  return filter === "all" || expense.recipient?.kind === filter;
}
export function recipientCounts(expenses: WithRecipient[]) {
  return {
    all: expenses.length,
    internal: expenses.filter(e => matchesRecipient(e, "internal")).length,
    external: expenses.filter(e => matchesRecipient(e, "external")).length,
  };
}