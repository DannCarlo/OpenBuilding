import { Sun, Moon, Upload } from 'lucide-react';
import { IconButton } from '../ui/IconButton';
import { useViewStore } from '../../store/viewStore';
import { useModelStore } from '../../store/modelStore';

export function TopBar() {
  const { theme, toggleTheme } = useViewStore();
  const { model, fileName, clearModel } = useModelStore();

  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 md:w-60 md:mt-1">
          <img src="/images/logo-icon.webp" alt="Logo" className="block md:hidden w-full h-full object-contain dark:invert" />
          <img src="/images/logo-full.webp" alt="Logo" className="hidden md:block w-full h-full object-contain dark:invert" />
        </div>
        {fileName && (
          <p className="text-[11px] sm:text-xs text-text-secondary mt-1 truncate max-w-35 sm:max-w-55">
            {fileName}
          </p>
        )}
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
