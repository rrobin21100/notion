-- MyLife App — Full Database Schema
-- Run this in your Supabase SQL Editor after creating a project

-- ========================
-- PROFILES
-- ========================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ========================
-- HEALTH
-- ========================
CREATE TABLE IF NOT EXISTS water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  amount_oz NUMERIC NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID REFERENCES medications NOT NULL,
  user_id UUID REFERENCES profiles NOT NULL,
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  skipped BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS supplements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS supplement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplement_id UUID REFERENCES supplements NOT NULL,
  user_id UUID REFERENCES profiles NOT NULL,
  taken_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  test_name TEXT NOT NULL,
  value NUMERIC,
  unit TEXT,
  reference_min NUMERIC,
  reference_max NUMERIC,
  tested_at DATE NOT NULL,
  notes TEXT
);

-- ========================
-- WORKOUTS
-- ========================
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  duration_minutes INTEGER,
  calories_burned INTEGER,
  notes TEXT,
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES workouts NOT NULL,
  exercise_name TEXT NOT NULL,
  sets INTEGER,
  reps INTEGER,
  weight_lbs NUMERIC,
  duration_seconds INTEGER,
  notes TEXT
);

-- ========================
-- CALENDAR & APPOINTMENTS
-- ========================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  location TEXT,
  all_day BOOLEAN DEFAULT FALSE,
  recurrence TEXT
);

-- ========================
-- SHOPPING & GROCERIES
-- ========================
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES shopping_lists NOT NULL,
  name TEXT NOT NULL,
  quantity TEXT,
  category TEXT,
  checked BOOLEAN DEFAULT FALSE,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pantry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC,
  unit TEXT,
  low_threshold NUMERIC,
  expiry_date DATE,
  category TEXT
);

-- ========================
-- HABITS
-- ========================
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  frequency TEXT DEFAULT 'daily',
  target_count INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES habits NOT NULL,
  user_id UUID REFERENCES profiles NOT NULL,
  logged_date DATE NOT NULL,
  count INTEGER DEFAULT 1,
  UNIQUE(habit_id, logged_date)
);

-- ========================
-- MEAL PLANNING & NUTRITION
-- ========================
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  week_start DATE NOT NULL,
  UNIQUE(user_id, week_start)
);

CREATE TABLE IF NOT EXISTS meal_plan_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES meal_plans NOT NULL,
  day_of_week INTEGER NOT NULL,
  meal_type TEXT NOT NULL,
  recipe_name TEXT NOT NULL,
  calories INTEGER,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC
);

CREATE TABLE IF NOT EXISTS nutrition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  food_name TEXT NOT NULL,
  calories INTEGER,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  meal_type TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================
-- FINANCE
-- ========================
CREATE TABLE IF NOT EXISTS budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  name TEXT NOT NULL,
  monthly_budget NUMERIC NOT NULL,
  color TEXT,
  icon TEXT
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  category_id UUID REFERENCES budget_categories,
  amount NUMERIC NOT NULL,
  description TEXT,
  merchant TEXT,
  spent_at DATE DEFAULT CURRENT_DATE
);

-- ========================
-- GOALS
-- ========================
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  target_date DATE,
  progress_percent INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goal_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ
);

-- ========================
-- MEDICAL HISTORY
-- ========================
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  record_type TEXT NOT NULL,
  name TEXT NOT NULL,
  details TEXT,
  date_recorded DATE,
  provider TEXT
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT,
  email TEXT,
  is_primary BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS insurance_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  provider TEXT NOT NULL,
  plan_name TEXT,
  member_id TEXT,
  group_number TEXT,
  effective_date DATE,
  notes TEXT
);

-- ========================
-- HOME MAINTENANCE
-- ========================
CREATE TABLE IF NOT EXISTS home_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  brand TEXT,
  model TEXT,
  purchase_date DATE,
  warranty_expires DATE,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES home_items,
  user_id UUID REFERENCES profiles NOT NULL,
  description TEXT NOT NULL,
  cost NUMERIC,
  provider TEXT,
  performed_at DATE NOT NULL,
  next_service_date DATE
);

-- ========================
-- INTEGRATIONS
-- ========================
CREATE TABLE IF NOT EXISTS whoop_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  metric_date DATE NOT NULL,
  recovery_score INTEGER,
  strain_score NUMERIC,
  hrv_ms NUMERIC,
  resting_hr INTEGER,
  sleep_quality INTEGER,
  sleep_hours NUMERIC,
  UNIQUE(user_id, metric_date)
);

CREATE TABLE IF NOT EXISTS whoop_connections (
  user_id UUID REFERENCES profiles PRIMARY KEY,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  whoop_user_id TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plaid_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles NOT NULL,
  access_token TEXT NOT NULL,
  item_id TEXT NOT NULL,
  institution_name TEXT,
  last_synced_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plaid_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES plaid_items NOT NULL,
  account_id TEXT NOT NULL,
  name TEXT,
  type TEXT,
  subtype TEXT,
  mask TEXT
);

CREATE TABLE IF NOT EXISTS google_calendar_connections (
  user_id UUID REFERENCES profiles PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  email TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS briefing_settings (
  user_id UUID REFERENCES profiles PRIMARY KEY,
  phone_number TEXT NOT NULL,
  send_time TIME DEFAULT '07:00',
  enabled BOOLEAN DEFAULT TRUE,
  sections JSONB DEFAULT '["calendar","medications","habits","meals","budget"]'
);

-- ========================
-- ROW LEVEL SECURITY
-- ========================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whoop_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE whoop_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefing_settings ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own data
-- profiles uses 'id' as its user column (PK references auth.users), all others use 'user_id'
CREATE POLICY "Users own their profile" ON profiles
  FOR ALL USING (id = auth.uid());

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'water_logs', 'medications', 'medication_logs',
    'supplements', 'supplement_logs', 'lab_results', 'workouts',
    'events', 'shopping_lists', 'pantry_items', 'habits', 'habit_logs',
    'meal_plans', 'nutrition_logs', 'budget_categories', 'expenses',
    'goals', 'medical_records', 'emergency_contacts', 'insurance_info',
    'home_items', 'maintenance_logs', 'whoop_metrics', 'whoop_connections',
    'plaid_items', 'briefing_settings', 'google_calendar_connections'
  ]
  LOOP
    EXECUTE format('CREATE POLICY "Users own their data" ON %I FOR ALL USING (user_id = auth.uid())', t);
  END LOOP;
END;
$$;

-- Policies for tables that join through a parent (shopping_items, workout_exercises, etc.)
CREATE POLICY "Users own shopping items" ON shopping_items
  FOR ALL USING (list_id IN (SELECT id FROM shopping_lists WHERE user_id = auth.uid()));

CREATE POLICY "Users own workout exercises" ON workout_exercises
  FOR ALL USING (workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid()));

CREATE POLICY "Users own meal plan entries" ON meal_plan_entries
  FOR ALL USING (plan_id IN (SELECT id FROM meal_plans WHERE user_id = auth.uid()));

CREATE POLICY "Users own goal milestones" ON goal_milestones
  FOR ALL USING (goal_id IN (SELECT id FROM goals WHERE user_id = auth.uid()));

CREATE POLICY "Users own plaid accounts" ON plaid_accounts
  FOR ALL USING (item_id IN (SELECT id FROM plaid_items WHERE user_id = auth.uid()));

-- Add Google Calendar columns to events table (run separately if table already exists)
ALTER TABLE events ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'local';
ALTER TABLE events ADD COLUMN IF NOT EXISTS google_event_id TEXT;
ALTER TABLE events ADD CONSTRAINT events_google_event_id_user_unique UNIQUE (user_id, google_event_id);
