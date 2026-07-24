import { ViewerCanvas } from './components/viewer/ViewerCanvas';
import { MainLayout } from './components/layout/MainLayout';
import { TopBar } from './components/layout/TopBar';
import { BottomToolbar } from './components/toolbar/BottomToolbar';
import { UploadOverlay } from './components/upload/UploadOverlay';
import { InfoPanel } from './components/panels/InfoPanel';
import { useModelStore } from './store/modelStore';
import { useViewStore } from './store/viewStore';
import { useEffect } from 'react';

export default function App() {
  const model = useModelStore((s) => s.model);
  const theme = useViewStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <MainLayout>
      <TopBar />

      {model ? (
        <>
          <ViewerCanvas />
          <BottomToolbar />
          <InfoPanel />
        </>
      ) : (
        <UploadOverlay />
      )}
    </MainLayout>
  );
}
