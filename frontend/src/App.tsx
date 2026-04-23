import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WorkspacePage } from '@/pages/WorkspacePage';
import { DebugPage } from '@/pages/DebugPage';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

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
    </BrowserRouter>
  );
}

export default App;