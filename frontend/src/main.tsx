import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { emitStartupLog } from '@/core/logger/service';

emitStartupLog('preview', '0.0.0', navigator.userAgent);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
