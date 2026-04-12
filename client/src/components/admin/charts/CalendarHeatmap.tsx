import React, { useMemo } from 'react';
import { Box, Tooltip, Typography, useTheme } from '@mui/material';
import type { HeatmapDay } from '../../../types/admin';

interface Props {
  data: HeatmapDay[];
  year: number;
}

const DAYS = ['', 'M', '', 'W', '', 'F', ''];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getIntensity(count: number, max: number): number {
  if (count === 0 || max === 0) return 0;
  return Math.ceil((count / max) * 4);
}

export default function CalendarHeatmap({ data, year }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { weeks, monthLabels } = useMemo(() => {
    const countMap = new Map(data.map(d => [d.date, d.count]));
    const max = Math.max(...data.map(d => d.count), 1);

    const start = new Date(`${year}-01-01T00:00:00Z`);
    const end = new Date(`${year}-12-31T00:00:00Z`);

    // Pad to start on Sunday
    const startDow = start.getUTCDay();
    const cells: Array<{ date: string | null; count: number; intensity: number }> = [];
    for (let i = 0; i < startDow; i++) cells.push({ date: null, count: 0, intensity: -1 });

    const cur = new Date(start);
    while (cur <= end) {
      const dateStr = cur.toISOString().split('T')[0];
      const count = countMap.get(dateStr) ?? 0;
      cells.push({ date: dateStr, count, intensity: getIntensity(count, max) });
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    // Pad to complete last week
    while (cells.length % 7 !== 0) cells.push({ date: null, count: 0, intensity: -1 });

    const weeksArr: typeof cells[] = [];
    for (let i = 0; i < cells.length; i += 7) weeksArr.push(cells.slice(i, i + 7));

    // Month labels: find which week column each month starts in
    const monthLabelArr: Array<{ month: string; col: number }> = [];
    let lastMonth = -1;
    weeksArr.forEach((week, colIdx) => {
      week.forEach(cell => {
        if (!cell.date) return;
        const m = new Date(cell.date + 'T00:00:00Z').getUTCMonth();
        if (m !== lastMonth) {
          monthLabelArr.push({ month: MONTHS[m], col: colIdx });
          lastMonth = m;
        }
      });
    });

    return { weeks: weeksArr, monthLabels: monthLabelArr, max };
  }, [data, year]);

  const CELL = 11;
  const GAP = 2;
  const colors = isDark
    ? ['#1e1e2e', '#3d2b8c', '#5e3fc4', '#7c56e8', '#a29bfe']
    : ['#ebedf0', '#c5b9f8', '#9d8af5', '#7c5af0', '#6C5CE7'];

  return (
    <Box sx={{ overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Month labels */}
        <Box sx={{ display: 'flex', mb: 0.5, ml: `${CELL + GAP + 4}px` }}>
          <Box sx={{ position: 'relative', height: 14, width: `${weeks.length * (CELL + GAP)}px` }}>
            {monthLabels.map((ml, i) => (
              <Typography
                key={i}
                variant="caption"
                sx={{
                  position: 'absolute',
                  left: `${ml.col * (CELL + GAP)}px`,
                  fontSize: 10,
                  color: 'text.secondary',
                  lineHeight: 1,
                }}
              >
                {ml.month}
              </Typography>
            ))}
          </Box>
        </Box>

        {/* Grid */}
        <Box sx={{ display: 'flex', gap: `${GAP}px` }}>
          {/* Day labels */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px`, mr: 0.5 }}>
            {DAYS.map((d, i) => (
              <Typography
                key={i}
                variant="caption"
                sx={{ fontSize: 9, color: 'text.secondary', height: CELL, lineHeight: `${CELL}px` }}
              >
                {d}
              </Typography>
            ))}
          </Box>

          {/* Week columns */}
          {weeks.map((week, wi) => (
            <Box key={wi} sx={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
              {week.map((cell, di) => (
                <Tooltip
                  key={di}
                  title={cell.date ? `${cell.date}: ${cell.count} ${cell.count === 1 ? 'entry' : 'entries'}` : ''}
                  arrow
                  placement="top"
                >
                  <Box
                    sx={{
                      width: CELL,
                      height: CELL,
                      borderRadius: '2px',
                      bgcolor: cell.intensity === -1 ? 'transparent' : colors[cell.intensity],
                      cursor: cell.date ? 'default' : 'default',
                      transition: 'transform 0.1s',
                      '&:hover': cell.date ? { transform: 'scale(1.4)', zIndex: 1 } : {},
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          ))}
        </Box>

        {/* Legend */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, justifyContent: 'flex-end' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Less</Typography>
          {colors.map((c, i) => (
            <Box key={i} sx={{ width: CELL, height: CELL, borderRadius: '2px', bgcolor: c }} />
          ))}
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>More</Typography>
        </Box>
      </Box>
    </Box>
  );
}
