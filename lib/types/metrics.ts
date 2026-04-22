export type MetricType = "algorithm_count" | "blog_count";

export interface MetricSummary {
  algorithm_count: number;
  blog_count: number;
  retro_rate_pct: number;
  monthly_completion_pct: number;
}

// Phase monthly targets from master-plan-6months.md
export const PHASE_TARGETS: Record<string, { algorithm: number; blog: number }> = {
  M1: { algorithm: 20, blog: 2 },
  M2: { algorithm: 40, blog: 5 },
  M3: { algorithm: 60, blog: 10 },
  M4: { algorithm: 80, blog: 15 },
  M5: { algorithm: 100, blog: 20 },
  M6: { algorithm: 120, blog: 25 },
};
