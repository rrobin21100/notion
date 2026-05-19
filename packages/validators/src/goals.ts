import { z } from 'zod'

export const goalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().max(50).optional(),
  target_date: z.string().optional(),
  progress_percent: z.number().int().min(0).max(100).default(0),
  status: z.enum(['active', 'completed', 'paused']).default('active'),
})

export const goalMilestoneSchema = z.object({
  goal_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  completed: z.boolean().default(false),
})
