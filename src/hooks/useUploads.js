import { useState, useCallback, useMemo } from 'react';
import { uploadFile } from '../api/messagesApi';

const useUploads = ({ token, userId, handleLogout, navigate }) => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const uploadMediaFile = useCallback(async (file) => {
    if (!file || !['image', 'video', 'audio'].some(type => file.type.startsWith(type))) {
      setError('Invalid file type. Only images, videos, and audio are allowed.');
      return null;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const response = await uploadFile(formData, token);
      setUploads((prev) => [...prev, { file, preview: URL.createObjectURL(file), type: file.type }]);
      return response.data;
    } catch (err) {
      if (err.status === 401) {
        handleLogout();
        navigate('/login');
      } else {
        setError(err.message || 'Failed to upload file');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, userId, handleLogout, navigate]);

  const clearUploads = useCallback(() => {
    setUploads([]);
    setError('');
  }, []);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  const apiMethods = useMemo(() => ({
    uploadMediaFile,
    clearUploads,
    clearError,
  }), [uploadMediaFile, clearUploads, clearError]);

  return {
    uploads,
    setUploads,
    loading,
    error,
    ...apiMethods,
  };
};

export default useUploads;