import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

export const useEntity = (fetchFunctions, token, handleLogout, navigate, entityName) => {
  const { showNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const retryCountRef = useRef(0);
  const failedFunctionsRef = useRef(new Set());
  const isMountedRef = useRef(true);
  const [isValid, setIsValid] = useState(true);

  // Validate fetchFunctions in a useEffect to avoid conditional hook calls
  useEffect(() => {
    if (!Array.isArray(fetchFunctions) || !fetchFunctions.every(fn => typeof fn === 'function')) {
      console.error(`useEntity: fetchFunctions must be an array of functions for ${entityName}, received:`, fetchFunctions);
      showNotification(`Invalid configuration for ${entityName} data loading.`, 'error');
      setIsValid(false);
      setIsLoading(false);
    } else {
      setIsValid(true);
    }
  }, [fetchFunctions, entityName, showNotification]);

  const loadData = useCallback(
    async (signal, params = {}) => {
      if (!isValid) {
        return;
      }
      if (!token) {
        showNotification('Authentication required.', 'error');
        if (isMountedRef.current) {
          setIsLoading(false);
          navigate('/login', { state: { from: window.location.pathname } });
        }
        return;
      }
      if (!isMountedRef.current) return;

      setIsLoading(true);
      try {
        const results = await Promise.all(
          fetchFunctions.map(async (fn, index) => {
            if (failedFunctionsRef.current.has(index) && retryCountRef.current >= 3) {
              console.debug(`Skipping retry for ${entityName} fetch function ${index} due to max retries`);
              return null;
            }
            try {
              const result = await fn(params, signal);
              failedFunctionsRef.current.delete(index); // Clear failure on success
              return result;
            } catch (err) {
              if (err.name !== 'AbortError') {
                failedFunctionsRef.current.add(index);
                throw err;
              }
              return null;
            }
          })
        );
        retryCountRef.current = 0; // Reset retry count on success
        if (isMountedRef.current) setIsLoading(false);
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
          showNotification(
            status === 429 ? 'Rate limit exceeded. Please try again later.' : `${entityName} not found.`,
            'error'
          );
          if (isMountedRef.current) setIsLoading(false);
          return;
        }
        const errorMessage = err.message?.includes('network')
          ? 'Network error. Please check your connection.'
          : err.message || `Failed to load ${entityName} data.`;
        showNotification(errorMessage, 'error');
        if (retryCountRef.current < 3 && isMountedRef.current) {
          const delay = Math.pow(2, retryCountRef.current) * 1000;
          console.debug(`Retrying ${entityName} load in ${delay}ms (retry ${retryCountRef.current + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retryCountRef.current += 1;
          return loadData(signal, params); // Recursive retry
        } else {
          console.warn(`Max retries reached for ${entityName}`);
          if (isMountedRef.current) setIsLoading(false);
        }
      }
    },
    [token, navigate, showNotification, fetchFunctions, entityName, isValid]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => {
      controller.abort();
      isMountedRef.current = false;
    };
  }, [loadData]);

  return {
    isLoading,
    actionLoading,
    setActionLoading,
    loadData,
    failedIndices: Array.from(failedFunctionsRef.current),
  };
};