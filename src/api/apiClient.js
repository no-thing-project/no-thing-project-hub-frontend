import axios from 'axios';
import config from '../config';

const api = axios.create({
  baseURL: config.REACT_APP_HUB_API_URL,
  timeout: 10000,
});

export const handleApiError = (err, setError) => {
  if (err.name === 'CanceledError') {
    const error = new Error('canceled');
    error.status = err.response?.status;
    console.debug('API Request canceled:', err);
    if (setError) setError('canceled');
    return error;
  }

  const errorMessage = err.response?.data?.errors?.[0] || err.message || 'An error occurred';
  const detailedError = {
    message: errorMessage,
    status: err.response?.status,
    url: err.config?.url,
    method: err.config?.method,
  };
  console.error('API Error:', detailedError);
  if (setError) setError(errorMessage);
  const error = new Error(errorMessage);
  error.status = err.response?.status;
  throw error;
};

// Validate and normalize request config
export const createRequest = async (method, url, config = {}) => {
  const { headers = {}, params, data, signal, ...rest } = config;
  console.debug('API Request signal:', signal instanceof AbortSignal ? 'Valid AbortSignal' : signal); // Debug
  try {
    const response = await api({
      method,
      url,
      headers,
      params,
      data,
      signal: signal instanceof AbortSignal ? signal : undefined, // Only pass valid AbortSignal
      ...rest,
    });
    return response;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Convenience methods
export const get = (url, config) => createRequest('get', url, config);
export const post = (url, data, config) => createRequest('post', url, { ...config, data });
export const put = (url, data, config) => createRequest('put', url, { ...config, data });
export const del = (url, config) => createRequest('delete', url, config);

export default api;