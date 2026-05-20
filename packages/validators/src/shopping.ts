import { z } from 'zod'

export const shoppingListSchema = z.object({
  name: z.string().min(1).max(100),
})

export const shoppingItemSchema = z.object({
  list_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  quantity: z.string().max(50).optional(),
  category: z.string().max(50).optional(),
  checked: z.boolean().default(false),
})

export const pantryItemSchema = z.object({
  name: z.string().min(1).max(100),
  quantity: z.number().positive().optional(),
  unit: z.string().max(20).optional(),
  low_threshold: z.number().positive().optional(),
  expiry_date: z.string().optional(),
  category: z.string().max(50).optional(),
})
