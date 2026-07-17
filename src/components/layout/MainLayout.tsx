import type { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

/**
 * Main app layout shell. All content is absolutely positioned
 * on top of the 3D canvas.
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="relative w-full h-full">
      {children}
    </div>
  );
}
