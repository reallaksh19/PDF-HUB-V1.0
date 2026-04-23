import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WorkspacePage } from '@/pages/WorkspacePage';
import { DebugPage } from '@/pages/DebugPage';
import { LandingPage } from '@/pages/LandingPage';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import '@/core/macro/headlessApi';

const AppContent = () => {
  useKeyboardShortcuts();
  useUnsavedChangesGuard();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/workspace" element={<WorkspacePage />} />
      <Route path="/debug" element={<DebugPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
