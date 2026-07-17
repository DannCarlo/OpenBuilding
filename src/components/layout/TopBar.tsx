import { Sun, Moon, Box, Upload } from 'lucide-react';
import { IconButton } from '../ui/IconButton';
import { useViewStore } from '../../store/viewStore';
import { useModelStore } from '../../store/modelStore';
import { useUIStore } from '../../store/uiStore';
import { APP_NAME } from '../../lib/constants';

/**
 * Top navigation bar with logo and controls.
 */
export function TopBar() {
  const { theme, toggleTheme } = useViewStore();
  const fileName = useModelStore((s) => s.fileName);
  const setShowUpload = useUIStore((s) => s.setShowUpload);
  const model = useModelStore((s) => s.model);

  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3">
      {/* Left: Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
          <Box size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-[var(--color-text-primary)] leading-none">
            {APP_NAME}
          </h1>
          {fileName && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate max-w-[200px]">
              {fileName}
            </p>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {model && (
          <IconButton
            icon={<Upload size={16} />}
            label="Upload new file"
            onClick={() => setShowUpload(true)}
          />
        )}
        <IconButton
          icon={theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          onClick={toggleTheme}
        />
      </div>
    </div>
  );
}
