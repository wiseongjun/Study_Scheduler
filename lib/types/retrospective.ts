export interface DoneThisWeek {
  assignment: string;
  blog: string;
  algorithm: string;
  db_cs: string;
  application: string;
}

export interface PlanVsActual {
  plan: string;
  actual: string;
  gap: string;
}

export interface RetroCondition {
  sleep: string;
  burnout: string;
  sustainable: string;
}

export interface WeeklyRetroData {
  done_this_week: DoneThisWeek;
  plan_vs_actual: PlanVsActual;
  learned: [string, string, string];
  blocked: string;
  next_goals: [string, string, string];
  condition: RetroCondition;
}

export const EMPTY_RETRO: WeeklyRetroData = {
  done_this_week: { assignment: "", blog: "", algorithm: "", db_cs: "", application: "" },
  plan_vs_actual: { plan: "", actual: "", gap: "" },
  learned: ["", "", ""],
  blocked: "",
  next_goals: ["", "", ""],
  condition: { sleep: "", burnout: "", sustainable: "" },
};
