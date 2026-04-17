import { pool } from '../db/pool';

// Seeded pseudo-random number generator for reproducible demo data
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20240417);

function randFloat(min: number, max: number, decimals = 1): number {
  const val = rand() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}


export async function seedDemoDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Group ──────────────────────────────────────────────────────────────
    const groupResult = await client.query<{ id: string }>(
      `INSERT INTO groups (name) VALUES ($1) RETURNING id`,
      ['Our Family']
    );
    const groupId = groupResult.rows[0].id;

    // ── Users ──────────────────────────────────────────────────────────────
    const palette = ['#1976d2', '#388e3c', '#d32f2f', '#7b1fa2', '#f57c00'];
    const names = (process.env.SEED_USERS || 'Alex,Jordan,Sam,Riley,Morgan')
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean);

    const userIds: string[] = [];
    for (let i = 0; i < names.length; i++) {
      const res = await client.query<{ id: string }>(
        `INSERT INTO users (group_id, display_name, avatar_color, sort_order)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [groupId, names[i], palette[i % palette.length], i]
      );
      userIds.push(res.rows[0].id);
    }

    // ── Categories ────────────────────────────────────────────────────────
    const categories = [
      { name: 'Weight Loss',           icon: '⚖️',  order: 0 },
      { name: 'Arabic Learning',       icon: '📖',  order: 1 },
      { name: 'Fitness',               icon: '🏋️',  order: 2 },
      { name: 'Quran',                 icon: '🕌',  order: 3 },
      { name: 'Professional Learning', icon: '💼',  order: 4 },
    ];

    const catIds: Record<string, string> = {};
    for (const cat of categories) {
      const res = await client.query<{ id: string }>(
        `INSERT INTO categories (group_id, name, icon, sort_order)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [groupId, cat.name, cat.icon, cat.order]
      );
      catIds[cat.name] = res.rows[0].id;
    }

    // ── Date range: 90 days back from today (2026-04-17) ─────────────────
    const today = new Date('2026-04-17');
    const startDate = addDays(today, -89); // 90 days inclusive

    // Helper: get all dates in a range that fall in a given period_key
    function datesInPeriod(pk: string): Date[] {
      const [y, m] = pk.split('-').map(Number);
      const result: Date[] = [];
      const cur = new Date(startDate);
      while (cur <= today) {
        if (cur.getFullYear() === y && cur.getMonth() + 1 === m) {
          result.push(new Date(cur));
        }
        cur.setDate(cur.getDate() + 1);
      }
      return result;
    }

    // Periods that overlap our 90-day window
    const periods = ['2026-01', '2026-02', '2026-03', '2026-04'];

    // ── Goal definitions per user ─────────────────────────────────────────
    // Each entry: { title, target_value, unit, frequency_type, goal_type, category, start_value? }
    // target_value is per-period (for 'total') or per-day/week
    type GoalDef = {
      title: string;
      target_value: number;
      unit: string;
      frequency_type: 'total' | 'daily' | 'weekly';
      goal_type: 'accumulation' | 'measurement';
      category: string;
      start_value?: number;
      // For progress generation: value range per entry, hit_rate 0-1
      entry_min: number;
      entry_max: number;
      hit_rate: number;
    };

    const goalsByUser: GoalDef[][] = [
      // Alex (index 0) — Weight Loss + Fitness + Professional
      [
        {
          title: 'Lose weight',
          target_value: 180,
          unit: 'lbs',
          frequency_type: 'total',
          goal_type: 'measurement',
          category: 'Weight Loss',
          start_value: 195,
          entry_min: 179,
          entry_max: 194,
          hit_rate: 0.75,
        },
        {
          title: 'Run weekly miles',
          target_value: 15,
          unit: 'miles',
          frequency_type: 'weekly',
          goal_type: 'accumulation',
          category: 'Fitness',
          entry_min: 2,
          entry_max: 5,
          hit_rate: 0.8,
        },
        {
          title: 'Read tech books',
          target_value: 30,
          unit: 'pages',
          frequency_type: 'daily',
          goal_type: 'accumulation',
          category: 'Professional Learning',
          entry_min: 20,
          entry_max: 40,
          hit_rate: 0.7,
        },
      ],
      // Jordan (index 1) — Arabic + Quran + Fitness
      [
        {
          title: 'Practice Arabic',
          target_value: 60,
          unit: 'min',
          frequency_type: 'daily',
          goal_type: 'accumulation',
          category: 'Arabic Learning',
          entry_min: 30,
          entry_max: 90,
          hit_rate: 0.78,
        },
        {
          title: 'Read Quran',
          target_value: 5,
          unit: 'pages',
          frequency_type: 'daily',
          goal_type: 'accumulation',
          category: 'Quran',
          entry_min: 3,
          entry_max: 10,
          hit_rate: 0.85,
        },
        {
          title: 'Gym sessions',
          target_value: 12,
          unit: 'sessions',
          frequency_type: 'total',
          goal_type: 'accumulation',
          category: 'Fitness',
          entry_min: 1,
          entry_max: 1,
          hit_rate: 0.72,
        },
      ],
      // Sam (index 2) — Weight Loss + Arabic + Professional
      [
        {
          title: 'Track weight',
          target_value: 165,
          unit: 'lbs',
          frequency_type: 'total',
          goal_type: 'measurement',
          category: 'Weight Loss',
          start_value: 178,
          entry_min: 164,
          entry_max: 177,
          hit_rate: 0.7,
        },
        {
          title: 'Anki Arabic vocab',
          target_value: 20,
          unit: 'cards',
          frequency_type: 'daily',
          goal_type: 'accumulation',
          category: 'Arabic Learning',
          entry_min: 10,
          entry_max: 30,
          hit_rate: 0.8,
        },
        {
          title: 'Online courses',
          target_value: 10,
          unit: 'hours',
          frequency_type: 'weekly',
          goal_type: 'accumulation',
          category: 'Professional Learning',
          entry_min: 1,
          entry_max: 3,
          hit_rate: 0.65,
        },
      ],
      // Riley (index 3) — Quran + Fitness + Weight Loss
      [
        {
          title: 'Memorize Quran',
          target_value: 3,
          unit: 'juz',
          frequency_type: 'total',
          goal_type: 'accumulation',
          category: 'Quran',
          entry_min: 0,
          entry_max: 1,
          hit_rate: 0.6,
        },
        {
          title: 'Steps per day',
          target_value: 8000,
          unit: 'steps',
          frequency_type: 'daily',
          goal_type: 'accumulation',
          category: 'Fitness',
          entry_min: 5000,
          entry_max: 12000,
          hit_rate: 0.82,
        },
        {
          title: 'Reach goal weight',
          target_value: 155,
          unit: 'lbs',
          frequency_type: 'total',
          goal_type: 'measurement',
          category: 'Weight Loss',
          start_value: 170,
          entry_min: 154,
          entry_max: 169,
          hit_rate: 0.68,
        },
      ],
      // Morgan (index 4) — Professional + Arabic + Quran
      [
        {
          title: 'LeetCode problems',
          target_value: 30,
          unit: 'problems',
          frequency_type: 'total',
          goal_type: 'accumulation',
          category: 'Professional Learning',
          entry_min: 1,
          entry_max: 3,
          hit_rate: 0.75,
        },
        {
          title: 'Arabic reading',
          target_value: 45,
          unit: 'min',
          frequency_type: 'daily',
          goal_type: 'accumulation',
          category: 'Arabic Learning',
          entry_min: 20,
          entry_max: 70,
          hit_rate: 0.76,
        },
        {
          title: 'Quran revision',
          target_value: 10,
          unit: 'pages',
          frequency_type: 'daily',
          goal_type: 'accumulation',
          category: 'Quran',
          entry_min: 5,
          entry_max: 15,
          hit_rate: 0.83,
        },
      ],
    ];

    // ── Insert goals and progress entries ─────────────────────────────────
    for (let u = 0; u < userIds.length; u++) {
      const userId = userIds[u];
      const defs = goalsByUser[u] ?? [];

      for (const def of defs) {
        // Create one goal row per period
        for (const pk of periods) {
          const datesInPk = datesInPeriod(pk);
          if (datesInPk.length === 0) continue;

          const goalRes = await client.query<{ id: string }>(
            `INSERT INTO goals
               (user_id, category_id, period_key, title, target_value, unit,
                frequency_type, goal_type, start_value)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id`,
            [
              userId,
              catIds[def.category],
              pk,
              def.title,
              def.target_value,
              def.unit,
              def.frequency_type,
              def.goal_type,
              def.start_value ?? null,
            ]
          );
          const goalId = goalRes.rows[0].id;

          // Generate progress entries for each day in this period that falls
          // within our 90-day window, respecting hit_rate
          for (const d of datesInPk) {
            // Skip with probability (1 - hit_rate)
            if (rand() > def.hit_rate) continue;

            let value: number;
            if (def.goal_type === 'measurement') {
              // Measurement: trend toward target from start_value
              const start = def.start_value ?? def.target_value + 10;
              rand(); // advance RNG state (was: progress toward goal)
              value = randFloat(
                Math.min(def.entry_min, start),
                Math.max(def.entry_max, start)
              );
              // Bias value: earlier dates closer to start, later closer to target
              const totalDays = 90;
              const dayOffset =
                Math.floor((d.getTime() - startDate.getTime()) / 86400000);
              const bias = dayOffset / totalDays;
              value = parseFloat(
                (start + bias * (def.target_value - start) + (rand() - 0.5) * 4).toFixed(1)
              );
            } else {
              value = randFloat(def.entry_min, def.entry_max);
            }

            await client.query(
              `INSERT INTO progress_entries (goal_id, value, logged_for)
               VALUES ($1, $2, $3)
               ON CONFLICT DO NOTHING`,
              [goalId, value, toDateStr(d)]
            );
          }
        }
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
