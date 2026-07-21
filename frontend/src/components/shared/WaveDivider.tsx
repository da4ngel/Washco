import { cn } from '@/lib/utils';

interface WaveDividerProps {
  /**
   * Color of the wave fill — set via a text color utility (the SVG fills with
   * `currentColor`). Use the color of the band the wave flows *into*.
   */
  className?: string;
  /** Flip vertically so the wave crests the other way. */
  flip?: boolean;
}

/**
 * Soft organic wave used to transition between light and dark landing bands
 * (mirrors the reference's white wavy dividers). Place it at the seam between
 * two sections; give it the destination band's color via `className`.
 */
export function WaveDivider({ className, flip }: WaveDividerProps) {
  return (
    <div
      className={cn('pointer-events-none w-full leading-[0]', flip ? '-mt-px' : '-mb-px', className)}
      aria-hidden
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className={cn('block h-[60px] w-full md:h-[90px]', flip && 'rotate-180')}
        fill="currentColor"
      >
        <path d="M0 64 C 240 8, 480 8, 720 52 C 960 96, 1200 120, 1440 72 L 1440 120 L 0 120 Z" />
      </svg>
    </div>
  );
}
