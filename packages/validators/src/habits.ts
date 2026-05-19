import { z } from 'zod'

export const habitSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  frequency: z.enum(['daily', 'weekly']).default('daily'),
  target_count: z.number().int().positive().default(1),
  active: z.boolean().default(true),
})

export const habitLogSchema = z.object({
  habit_id: z.string().uuid(),
  logged_date: z.string(),
  count: z.number().int().positive().default(1),
})
