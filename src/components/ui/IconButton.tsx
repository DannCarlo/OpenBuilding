import { motion } from 'framer-motion';

interface IconButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  className?: string;
}

/**
 * Clean icon button with tooltip and active state.
 */
export function IconButton({ icon, label, onClick, active = false, className = '' }: IconButtonProps) {
  return (
    <motion.button
      className={`p-2 rounded-lg transition-colors duration-150 flex items-center justify-center
        ${active
          ? 'bg-[var(--color-accent)] text-white'
          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/10'
        }
        ${className}`}
      onClick={onClick}
      title={label}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {icon}
    </motion.button>
  );
}
