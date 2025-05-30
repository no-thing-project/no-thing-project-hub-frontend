import api from './apiClient';
import { handleApiError } from './apiClient';
import { SUPPORTED_MIME_TYPES, MAX_FILE_SIZE, MAX_FILES } from '../constants/validations';

/**
 * Requests a presigned URL for uploading a file.
 * @param {string} fileType - MIME type of the file
 * @param {string} contentType - Content type (e.g., 'image', 'video')
 * @param {string} token - Authorization token
 * @returns {Promise<Object>} - { presignedUrl, fileKey, contentType, publicUrl }
 */
export const getPresignedUrl = async (fileType, contentType, token) => {
  try {
    const response = await api.post('/api/v1/tweets/presigned-url', { fileType, contentType }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.content;
  } catch (err) {
    throw handleApiError(err, { presignedUrl: null, fileKey: null, contentType: fileType, publicUrl: null });
  }
};

/**
 * Uploads a file to S3 using a presigned URL.
 * @param {File} file - File to upload
 * @param {string} presignedUrl - Presigned URL for upload
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<void>}
 */
const uploadToPresignedUrl = async (file, presignedUrl, onProgress) => {
  try {
    const xhr = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress?.(percent);
        }
      });
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
        }
      });
      xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));
      xhr.open('PUT', presignedUrl, true);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  } catch (err) {
    throw new Error(`Failed to upload ${file.name}: ${err.message}`);
  }
};

/**
 * Uploads multiple files using presigned URLs.
 * @param {File[]} files - Array of files to upload
 * @param {string} token - Authorization token
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object[]>} - Array of file metadata
 */
export const uploadFiles = async (files, token, onProgress) => {
  if (!files?.length) return [];

  // Validate files
  const validFiles = files.filter(file => {
    if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
      console.warn(`Skipping unsupported file type: ${file.type}`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      console.warn(`Skipping file exceeding size limit: ${file.name}`);
      return false;
    }
    return true;
  });

  if (!validFiles.length) {
    throw new Error('No valid files to upload');
  }
  if (validFiles.length > MAX_FILES) {
    throw new Error(`Maximum ${MAX_FILES} files allowed`);
  }

  const totalFiles = validFiles.length;
  let totalProgress = 0;

  try {
    const uploadPromises = validFiles.map(async file => {
      try {
        const contentType = file.type.split('/')[0];
        const { presignedUrl, fileKey, contentType: fileType, publicUrl } = await getPresignedUrl(file.type, contentType, token);

        await uploadToPresignedUrl(file, presignedUrl, progress => {
          const fileProgress = progress / totalFiles;
          totalProgress = totalProgress - (totalProgress / totalFiles) + fileProgress;
          onProgress?.(Math.min(Math.round(totalProgress), 100));
        });

        return {
          fileKey,
          url: publicUrl || presignedUrl.split('?')[0], // Use publicUrl or fallback to presignedUrl without query params
          contentType: fileType,
          size: file.size,
        };
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const uploadedFiles = results.filter(result => result !== null);

    if (!uploadedFiles.length) {
      throw new Error('All file uploads failed');
    }

    return uploadedFiles;
  } catch (err) {
    console.error('Upload error:', err);
    throw new Error(`File upload failed: ${err.message}`);
  }
};