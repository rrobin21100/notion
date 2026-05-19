import { z } from 'zod'

export const eventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  event_type: z.enum(['appointment', 'reminder', 'personal', 'home', 'medical', 'fitness']).optional(),
  start_at: z.string(),
  end_at: z.string().optional(),
  location: z.string().max(200).optional(),
  all_day: z.boolean().default(false),
  recurrence: z.string().optional(),
})
