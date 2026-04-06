import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GoalCard from '../GoalCard';
import { ToastProvider } from '../../Toast';
import type { GoalWithProgress } from '../../../types';

// Mock progress hooks so drawer doesn't make real network calls
vi.mock('../../../hooks/useProgress', () => ({
  useProgress: () => ({ data: [], isLoading: false }),
  useUpdateProgress: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteProgress: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

// Mock goal hooks so drawer's delete goal button doesn't make real network calls
vi.mock('../../../hooks/useGoals', () => ({
  useDeleteGoal: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

// Mock ProgressLogDialog (opened by QuickLogButton) — not the focus of these tests
vi.mock('../../progress/ProgressLogDialog', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="progress-log-dialog" /> : null,
}));

// Mock GoalFormDialog (opened by edit goal button in drawer) — requires UserContext provider
vi.mock('../../goals/GoalFormDialog', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="goal-form-dialog" /> : null,
}));

function makeGoal(overrides: Partial<GoalWithProgress & { id: string }> = {}): GoalWithProgress & {
  id: string;
} {
  return {
    id: 'goal-1',
    user_id: 'user-1',
    category_id: null,
    period_key: '2026-04',
    title: 'Read more books',
    category: null,
    target_value: 4,
    unit: 'books',
    frequency_type: 'total',
    goal_type: 'accumulation',
    start_value: null,
    current_value: 2,
    expected_value: null,
    percentage: 50,
    on_track: null,
    recent_entries: [],
    ...overrides,
  };
}

function renderCard(goal: GoalWithProgress & { id: string }, readOnly = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <GoalCard goal={goal} readOnly={readOnly} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('GoalCard', () => {
  describe('label rendering', () => {
    it('shows monthly label when no category', () => {
      renderCard(makeGoal({ frequency_type: 'total', target_value: 4, unit: 'books' }));
      expect(screen.getByText('4 books/month')).toBeInTheDocument();
    });

    it('prefixes label with category name when category is set', () => {
      renderCard(
        makeGoal({
          category: { id: 'cat-1', name: 'Reading' },
          frequency_type: 'total',
          target_value: 4,
          unit: 'books',
        }),
      );
      expect(screen.getByText('Reading: 4 books/month')).toBeInTheDocument();
    });

    it('shows goal title as caption', () => {
      renderCard(makeGoal({ title: 'My reading goal' }));
      expect(screen.getByText('My reading goal')).toBeInTheDocument();
    });

    it('shows percentage chip', () => {
      renderCard(makeGoal({ percentage: 75 }));
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('caps percentage chip at 100%', () => {
      renderCard(makeGoal({ percentage: 120 }));
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('pacing indicator', () => {
    it('shows "On track" when on_track is true', () => {
      renderCard(makeGoal({ on_track: true }));
      expect(screen.getByText('On track')).toBeInTheDocument();
    });

    it('shows "Behind" when on_track is false', () => {
      renderCard(makeGoal({ on_track: false }));
      expect(screen.getByText('Behind')).toBeInTheDocument();
    });

    it('shows neither indicator when on_track is null', () => {
      renderCard(makeGoal({ on_track: null }));
      expect(screen.queryByText('On track')).not.toBeInTheDocument();
      expect(screen.queryByText('Behind')).not.toBeInTheDocument();
    });
  });

  describe('readOnly mode', () => {
    it('renders QuickLogButton when not readOnly', () => {
      renderCard(makeGoal(), false);
      expect(
        screen.getByRole('button', { name: /log progress/i }),
      ).toBeInTheDocument();
    });

    it('does not render QuickLogButton when readOnly is true', () => {
      renderCard(makeGoal(), true);
      expect(screen.queryByRole('button', { name: /log progress/i })).not.toBeInTheDocument();
    });

    it('shows "Log Measurement" button for measurement goals', () => {
      renderCard(makeGoal({ goal_type: 'measurement' }), false);
      expect(screen.getByRole('button', { name: /log measurement/i })).toBeInTheDocument();
    });
  });

  describe('drawer interaction', () => {
    it('opens ProgressHistoryDrawer when card is clicked', () => {
      const { container } = renderCard(makeGoal());
      const card = container.querySelector('.MuiCard-root') as HTMLElement;
      fireEvent.click(card);
      // Drawer header label should appear
      expect(screen.getAllByText(/books\/month/).length).toBeGreaterThan(0);
    });
  });
});
