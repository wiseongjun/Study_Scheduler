-- user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  start_date DATE NOT NULL,
  current_phase_override TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- plan_templates (applicable_phases array for deduplication)
CREATE TABLE IF NOT EXISTS plan_templates (
  id SERIAL PRIMARY KEY,
  applicable_phases TEXT[] NOT NULL,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  time_block_start TIME NOT NULL,
  time_block_end TIME NOT NULL,
  default_task_label TEXT NOT NULL,
  routine_type TEXT NOT NULL,
  sort_order SMALLINT DEFAULT 0
);

-- daily_checks
CREATE TABLE IF NOT EXISTS daily_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  plan_template_id INT REFERENCES plan_templates NOT NULL,
  custom_label TEXT,
  is_done BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, date, plan_template_id)
);

-- weekly_retrospectives
CREATE TABLE IF NOT EXISTS weekly_retrospectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  week_start_date DATE NOT NULL,
  done_this_week JSONB NOT NULL DEFAULT '{}',
  plan_vs_actual JSONB NOT NULL DEFAULT '{}',
  learned TEXT[] NOT NULL DEFAULT '{}',
  blocked TEXT,
  next_goals TEXT[] NOT NULL DEFAULT '{}',
  condition JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

-- monthly_checklists
CREATE TABLE IF NOT EXISTS monthly_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  month_start_date DATE NOT NULL,
  phase_id TEXT NOT NULL,
  checks_json JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month_start_date)
);

-- metric_events (append-only, date dimension for monthly comparison)
CREATE TABLE IF NOT EXISTS metric_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  metric_type TEXT NOT NULL,
  date DATE NOT NULL,
  delta INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_checks_user_date ON daily_checks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_metric_events_user_type_date ON metric_events(user_id, metric_type, date);
CREATE INDEX IF NOT EXISTS idx_weekly_retro_user_week ON weekly_retrospectives(user_id, week_start_date);
CREATE INDEX IF NOT EXISTS idx_monthly_checks_user_month ON monthly_checklists(user_id, month_start_date);

-- RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_retrospectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own their profile" ON user_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users own their daily checks" ON daily_checks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users own their retros" ON weekly_retrospectives FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users own their monthly" ON monthly_checklists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users own their metrics" ON metric_events FOR ALL USING (auth.uid() = user_id);

-- plan_templates is public read
ALTER TABLE plan_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_templates public read" ON plan_templates FOR SELECT USING (true);

-- Rolling month Phase function
CREATE OR REPLACE FUNCTION current_phase(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_start_date DATE;
  v_months_elapsed INT;
  v_override TEXT;
BEGIN
  -- Enforce caller identity: only the owner can query their own phase
  IF p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'access denied';
  END IF;

  SELECT start_date, current_phase_override
  INTO v_start_date, v_override
  FROM user_profiles WHERE user_id = p_user_id;

  IF v_override IS NOT NULL THEN RETURN v_override; END IF;
  IF v_start_date IS NULL THEN RETURN NULL; END IF;

  -- Rolling month: count full months elapsed
  v_months_elapsed := (
    EXTRACT(YEAR FROM age(CURRENT_DATE, v_start_date))::INT * 12 +
    EXTRACT(MONTH FROM age(CURRENT_DATE, v_start_date))::INT
  );

  RETURN 'M' || LEAST(v_months_elapsed + 1, 6)::TEXT;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Views
CREATE OR REPLACE VIEW v_retro_rate
WITH (security_invoker = true) AS
SELECT
  user_id,
  COUNT(*) AS written_weeks,
  GREATEST(1,
    FLOOR(
      (CURRENT_DATE - (
        SELECT start_date FROM user_profiles up WHERE up.user_id = wr.user_id
      )) / 7.0
    )
  )::INT AS elapsed_weeks,
  ROUND(
    COUNT(*) * 100.0 / GREATEST(1,
      FLOOR(
        (CURRENT_DATE - (
          SELECT start_date FROM user_profiles up WHERE up.user_id = wr.user_id
        )) / 7.0
      )
    ),
  1) AS rate_pct
FROM weekly_retrospectives wr
GROUP BY user_id;

CREATE OR REPLACE VIEW v_daily_completion
WITH (security_invoker = true) AS
SELECT
  user_id,
  date,
  COUNT(*) FILTER (WHERE is_done) AS done_count,
  COUNT(*) AS total_count,
  ROUND(COUNT(*) FILTER (WHERE is_done) * 100.0 / NULLIF(COUNT(*), 0), 1) AS rate_pct
FROM daily_checks
GROUP BY user_id, date;
