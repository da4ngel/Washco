import { useThemeStore } from '@/store/themeStore';

export interface ChartColors {
  /** Primary/navy series — lightened in dark so bars stay visible on dark cards. */
  navy: string;
  /** Accent/lime series (works on both themes). */
  lime: string;
  /** Lime stroke for area charts. */
  limeStroke: string;
}

/** Returns chart series colors that adapt to the current theme. */
export function useChartColors(): ChartColors {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const dark = resolvedTheme === 'dark';
  return {
    navy: dark ? '#7fb2e6' : '#0d1b2a',
    lime: '#A3E635',
    limeStroke: dark ? '#A3E635' : '#65A30D',
  };
}
