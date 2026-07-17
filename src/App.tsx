import { AnimatePresence } from 'framer-motion';
import { ViewerCanvas } from './components/viewer/ViewerCanvas';
import { MainLayout } from './components/layout/MainLayout';
import { TopBar } from './components/layout/TopBar';
import { StatusBar } from './components/layout/StatusBar';
import { ViewToolbar } from './components/toolbar/ViewToolbar';
import { UploadOverlay } from './components/upload/UploadOverlay';
import { InfoPanel } from './components/panels/InfoPanel';
import { useModelStore } from './store/modelStore';
import { useUIStore } from './store/uiStore';
import { useViewStore } from './store/viewStore';
import { useEffect } from 'react';

export default function App() {
  const model = useModelStore((s) => s.model);
  const showUpload = useUIStore((s) => s.showUpload);
  const theme = useViewStore((s) => s.theme);

  // Sync theme class to document
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  return (
    <MainLayout>
      {/* 3D Canvas always rendered as background */}
      <ViewerCanvas />

      {/* UI overlay */}
      <TopBar />

      {model && <ViewToolbar />}

      {model && <StatusBar />}

      <InfoPanel />

      <AnimatePresence>
        {showUpload && <UploadOverlay />}
      </AnimatePresence>
    </MainLayout>
  );
}
