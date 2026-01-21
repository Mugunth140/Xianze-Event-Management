'use client';

import { useCallback, useEffect, useState } from 'react';

interface UseProjectorModeReturn {
  isProjectorMode: boolean;
  toggleProjectorMode: () => void;
  enableProjectorMode: () => void;
  disableProjectorMode: () => void;
}

const STORAGE_KEY = 'projectorMode';

export default function useProjectorMode(): UseProjectorModeReturn {
  const [isProjectorMode, setIsProjectorMode] = useState(false);

  useEffect(() => {
    // Load preference from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'true') {
      setIsProjectorMode(true);
      document.documentElement.classList.add('projector-mode');
    }
  }, []);

  const updateMode = useCallback((enabled: boolean) => {
    setIsProjectorMode(enabled);
    localStorage.setItem(STORAGE_KEY, String(enabled));
    if (enabled) {
      document.documentElement.classList.add('projector-mode');
    } else {
      document.documentElement.classList.remove('projector-mode');
    }
  }, []);

  const toggleProjectorMode = useCallback(() => {
    updateMode(!isProjectorMode);
  }, [isProjectorMode, updateMode]);

  const enableProjectorMode = useCallback(() => {
    updateMode(true);
  }, [updateMode]);

  const disableProjectorMode = useCallback(() => {
    updateMode(false);
  }, [updateMode]);

  return {
    isProjectorMode,
    toggleProjectorMode,
    enableProjectorMode,
    disableProjectorMode,
  };
}
