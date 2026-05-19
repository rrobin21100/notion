import { z } from 'zod'

export const waterLogSchema = z.object({
  amount_oz: z.number().positive().max(128),
})

export const medicationSchema = z.object({
  name: z.string().min(1).max(100),
  dosage: z.string().max(50).optional(),
  frequency: z.enum(['daily', 'twice_daily', 'three_times_daily', 'weekly', 'as_needed']).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  notes: z.string().max(500).optional(),
  active: z.boolean().default(true),
})

export const supplementSchema = z.object({
  name: z.string().min(1).max(100),
  dosage: z.string().max(50).optional(),
  frequency: z.enum(['daily', 'twice_daily', 'weekly', 'as_needed']).optional(),
  active: z.boolean().default(true),
})

export const labResultSchema = z.object({
  test_name: z.string().min(1).max(100),
  value: z.number().optional(),
  unit: z.string().max(20).optional(),
  reference_min: z.number().optional(),
  reference_max: z.number().optional(),
  tested_at: z.string(),
  notes: z.string().max(500).optional(),
})

export const workoutSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['strength', 'cardio', 'yoga', 'hiit', 'pilates', 'sport', 'other']).optional(),
  duration_minutes: z.number().int().positive().optional(),
  calories_burned: z.number().int().positive().optional(),
  notes: z.string().max(500).optional(),
  performed_at: z.string().optional(),
})

export const workoutExerciseSchema = z.object({
  exercise_name: z.string().min(1).max(100),
  sets: z.number().int().positive().optional(),
  reps: z.number().int().positive().optional(),
  weight_lbs: z.number().positive().optional(),
  duration_seconds: z.number().int().positive().optional(),
  notes: z.string().max(200).optional(),
})

export const whoopMetricsSchema = z.object({
  metric_date: z.string(),
  recovery_score: z.number().int().min(0).max(100).optional(),
  strain_score: z.number().min(0).max(21).optional(),
  hrv_ms: z.number().positive().optional(),
  resting_hr: z.number().int().positive().optional(),
  sleep_quality: z.number().int().min(0).max(100).optional(),
  sleep_hours: z.number().positive().optional(),
})
