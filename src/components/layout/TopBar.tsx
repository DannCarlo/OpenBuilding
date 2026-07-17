import { Sun, Moon, Box, Upload } from 'lucide-react';
import { IconButton } from '../ui/IconButton';
import { useViewStore } from '../../store/viewStore';
import { useModelStore } from '../../store/modelStore';
import { APP_NAME } from '../../lib/constants';

export function TopBar() {
  const { theme, toggleTheme } = useViewStore();
  const { model, fileName, clearModel } = useModelStore();

  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[var(--color-accent)] flex items-center justify-center shrink-0 shadow-sm">
          <Box size={18} className="text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)] leading-none truncate">
            {APP_NAME}
          </h1>
          {fileName && (
            <p className="text-[11px] sm:text-xs text-[var(--color-text-secondary)] mt-1 truncate max-w-[140px] sm:max-w-[220px]">
              {fileName}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {model && (
          <IconButton
            icon={<Upload size={15} />}
            label="Open another file"
            onClick={clearModel}
          />
        )}
        <IconButton
          icon={theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          label={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          onClick={toggleTheme}
        />
      </div>
    </div>
  );
}
