import { useState, useCallback, useMemo } from 'react';
import { uploadFile, fetchFile, deleteFile } from '../api/messagesApi';

const useUploads = ({ token, userId, onLogout, navigate }) => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generic API call handler
  const handleApiCall = useCallback(async (apiFn, ...args) => {
    setLoading(true);
    try {
      const res = await apiFn(...args, token);
      setLoading(false);
      return res;
    } catch (err) {
      setLoading(false);
      if (err.status === 401 || err.status === 403) {
        onLogout('Session expired. Please log in again.');
        navigate('/login');
      }
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [token, onLogout, navigate]);

  // Upload a file
  const uploadMediaFile = useCallback(async (file) => {
    if (!file) throw new Error('File is required');
    const data = await handleApiCall(uploadFile, file);
    setUploads((prev) => [...prev, data]);
    return data;
  }, [handleApiCall]);

  // Fetch a file
  const fetchMediaFile = useCallback((fileKey) => {
    if (!fileKey) throw new Error('File key is required');
    return handleApiCall(fetchFile, fileKey);
  }, [handleApiCall]);

  // Delete a file
  const deleteMediaFile = useCallback(async (fileKey) => {
    if (!fileKey) throw new Error('File key is required');
    await handleApiCall(deleteFile, fileKey);
    setUploads((prev) => prev.filter((upload) => upload.fileKey !== fileKey));
  }, [handleApiCall]);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  return useMemo(() => ({
    uploads,
    loading,
    error,
    uploadMediaFile,
    fetchMediaFile,
    deleteMediaFile,
    clearError,
  }), [uploads, loading, error, uploadMediaFile, fetchMediaFile, deleteMediaFile, clearError]);
};

export default useUploads;