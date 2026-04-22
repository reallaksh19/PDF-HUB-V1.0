import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WorkspacePage } from '@/pages/WorkspacePage';
import { DebugPage } from '@/pages/DebugPage';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { ToastProvider } from '@/components/ui/Toast';

const AppContent = () => {
  useKeyboardShortcuts();
  useUnsavedChangesGuard();

  return (
    <Routes>
      <Route path="/" element={<WorkspacePage />} />
      <Route path="/debug" element={<DebugPage />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
      <ToastProvider />
    </BrowserRouter>
  );
}

export default App;