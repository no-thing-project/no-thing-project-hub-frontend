// src/hooks/useFileUpload.js
import { useState, useCallback, useRef } from 'react';
import { SUPPORTED_MIME_TYPES, MAX_FILE_SIZE, MAX_FILES } from '../constants/validations';

export const useFileUpload = () => {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileUrlsRef = useRef(new Map());

  // Validate a single file
  const validateFile = useCallback((file) => {
    if (!file) {
      setError('No file selected');
      return false;
    }
    if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
      setError(`Unsupported file type: ${file.type}. Supported types: images, videos, audio.`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds 50MB limit');
      return false;
    }
    return true;
  }, []);

  // Handle file selection
  const handleFileChange = useCallback((e) => {
    const newFiles = Array.from(e.target.files).filter(validateFile);
    if (newFiles.length + files.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed`);
      return;
    }
    setFiles((prev) => [...prev, ...newFiles]);
    setError(null);
  }, [files, validateFile]);

  // Remove a file
  const removeFile = useCallback((index) => {
    setFiles((prev) => {
      const fileToRemove = prev[index];
      const url = fileUrlsRef.current.get(fileToRemove);
      if (url) {
        URL.revokeObjectURL(url);
        fileUrlsRef.current.delete(fileToRemove);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Simulate file upload (replace with actual API call)
  const uploadFiles = useCallback(async (files, onProgress) => {
    try {
      // Simulate upload process
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        onProgress(i);
      }
      return files.map((file) => ({
        fileKey: file.name,
        url: URL.createObjectURL(file), // In a real app, this would be a server URL
        contentType: file.type,
      }));
    } catch (err) {
      setError('Failed to upload files');
      throw err;
    }
  }, []);

  // Clean up file URLs
  const cleanup = useCallback(() => {
    fileUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    fileUrlsRef.current.clear();
    setFiles([]);
    setUploadProgress(0);
    setError(null);
  }, []);

  return {
    files,
    setFiles,
    error,
    setError,
    uploadProgress,
    setUploadProgress,
    handleFileChange,
    removeFile,
    uploadFiles,
    cleanup,
    fileUrlsRef,
  };
};