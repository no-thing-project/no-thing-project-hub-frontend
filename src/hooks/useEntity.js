import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

export const useEntity = (fetchFunctions, token, handleLogout, navigate, entityName) => {
  const { showNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [failedFunctions, setFailedFunctions] = useState(new Set());

  // Validate fetchFunctions
  if (!Array.isArray(fetchFunctions) || !fetchFunctions.every(fn => typeof fn === 'function')) {
    console.error(`useEntity: fetchFunctions must be an array of functions for ${entityName}, received:`, fetchFunctions);
    showNotification(`Invalid configuration for ${entityName} data loading.`, 'error');
    setIsLoading(false);
  }

  const loadData = useCallback(
    async (signal, params = {}) => {
      if (!token) {
        showNotification('Authentication required.', 'error');
        setIsLoading(false);
        navigate('/login', { state: { from: window.location.pathname } });
        return;
      }
      setIsLoading(true);
      try {
        const results = await Promise.all(
          fetchFunctions.map(async (fn, index) => {
            if (failedFunctions.has(index) && retryCount >= 3) {
              console.debug(`Skipping retry for ${entityName} fetch function ${index} due to max retries`);
              return null;
            }
            try {
              const result = await fn(params, signal);
              failedFunctions.delete(index); // Clear failure on success
              return result;
            } catch (err) {
              if (err.name !== 'AbortError') {
                failedFunctions.add(index);
                throw err;
              }
              return null;
            }
          })
        );
        setRetryCount(0); // Reset retry count on success
        return results;
      } catch (err) {
        if (err.name === 'AbortError') {
          console.debug(`Aborted ${entityName} data load`);
          return;
        }
        console.error(`Load ${entityName} error:`, err);
        const status = err.status || 500;
        if (status === 429 || status === 404) {
          console.warn(`Skipping retry for ${entityName} due to status ${status}`);
          return; // Skip retries for rate limit or not found
        }
        const errorMessage = err.message.includes('network')
          ? 'Network error. Please check your connection.'
          : err.message || `Failed to load ${entityName} data.`;
        showNotification(errorMessage, 'error');
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000;
          console.debug(`Retrying ${entityName} load in ${delay}ms (retry ${retryCount + 1})`);
          setTimeout(() => setRetryCount((prev) => prev + 1), delay);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [token, navigate, showNotification, retryCount, fetchFunctions, entityName, failedFunctions]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  return { isLoading, actionLoading, setActionLoading, loadData };
};