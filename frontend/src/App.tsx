import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WorkspacePage } from '@/pages/WorkspacePage';
import { DebugPage } from '@/pages/DebugPage';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

const AppContent = () => {
  useKeyboardShortcuts();
  
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
