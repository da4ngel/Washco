import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore, Theme } from '@/store/themeStore';
import { cn } from '@/lib/utils';

const ICONS: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};
const LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

interface ThemeToggleProps {
  className?: string;
  /** When true, shows the label next to the icon (for menus/sidebars). */
  showLabel?: boolean;
}

/** Cycles Light → Dark → System. */
export function ThemeToggle({ className, showLabel }: ThemeToggleProps) {
  const theme = useThemeStore((s) => s.theme);
  const cycleTheme = useThemeStore((s) => s.cycleTheme);
  const Icon = ICONS[theme];

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={`Theme: ${LABELS[theme]}. Click to change.`}
      title={`Theme: ${LABELS[theme]}`}
      className={cn(
        'inline-flex items-center gap-2 rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
        className
      )}
    >
      <Icon className="h-[1.15rem] w-[1.15rem]" />
      {showLabel && <span className="text-sm font-medium">{LABELS[theme]}</span>}
    </button>
  );
}
