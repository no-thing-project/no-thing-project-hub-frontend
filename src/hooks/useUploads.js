import { useState, useCallback, useMemo } from 'react';
import { uploadFile } from '../api/messagesApi';
import { v4 as uuidv4 } from 'uuid';

const useUploads = ({ token, userId, handleLogout, navigate }) => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const uploadMediaFile = useCallback(async (file) => {
    if (!file || !['image', 'video', 'audio'].some(type => file.type.startsWith(type))) {
      setError('Invalid file type. Only images, videos, and audio are allowed.');
      return null;
    }

    const fileId = uuidv4(); // Унікальний ідентифікатор для файлу
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const response = await uploadFile(formData, token);
      const previewUrl = URL.createObjectURL(file);
      setUploads((prev) => [
        ...prev.filter((item) => item.fileId !== fileId), // Уникаємо дублювання
        { fileId, file, preview: previewUrl, type: file.type },
      ]);
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
    setUploads((prev) => {
      prev.forEach((item) => {
        if (item.preview) URL.revokeObjectURL(item.preview); // Очищаємо URL
      });
      return [];
    });
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