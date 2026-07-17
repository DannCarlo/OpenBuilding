import { motion } from 'framer-motion';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

/**
 * Reusable frosted-glass panel with blur backdrop.
 */
export function GlassPanel({ children, className = '', style, onClick }: GlassPanelProps) {
  return (
    <motion.div
      className={`glass ${className}`}
      style={{
        boxShadow: 'var(--shadow-glass)',
        ...style,
      }}
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
