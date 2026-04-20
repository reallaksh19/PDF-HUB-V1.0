import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/core/session/store';

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const { setZoom } = useSessionStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const zoomSteps = [25, 50, 75, 100, 125, 150, 200, 300, 400];

      // Ctrl+Shift+D or Cmd+Shift+D -> /debug
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        navigate('/debug');
      }

      // Ctrl+ or Cmd+ -> Zoom In
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        const currentZoom = useSessionStore.getState().viewState.zoom;
        const nextZoom = zoomSteps.find(step => step > currentZoom) || 400;
        setZoom(nextZoom);
      }

      // Ctrl- or Cmd- -> Zoom Out
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        const currentZoom = useSessionStore.getState().viewState.zoom;
        const nextZoom = zoomSteps.slice().reverse().find(step => step < currentZoom) || 25;
        setZoom(nextZoom);
      }
      
      // Ctrl+0 or Cmd+0 -> Zoom Reset
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        setZoom(100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, setZoom]);
};
