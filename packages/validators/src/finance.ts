import { z } from 'zod'

export const budgetCategorySchema = z.object({
  name: z.string().min(1).max(50),
  monthly_budget: z.number().positive(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().max(10).optional(),
})

export const expenseSchema = z.object({
  category_id: z.string().uuid().optional(),
  amount: z.number().positive(),
  description: z.string().max(200).optional(),
  merchant: z.string().max(100).optional(),
  spent_at: z.string().optional(),
})
