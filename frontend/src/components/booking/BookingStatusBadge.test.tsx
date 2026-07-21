import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BookingStatusBadge } from './BookingStatusBadge';

// Smoke test proving the React Testing Library + jsdom harness renders components.
describe('BookingStatusBadge', () => {
  it('renders a human-readable label for each status', () => {
    render(<BookingStatusBadge status="in_progress" />);
    expect(screen.getByText('In progress')).toBeInTheDocument();
  });

  it('renders the completed label', () => {
    render(<BookingStatusBadge status="completed" />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });
});
