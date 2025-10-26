import axios from 'axios';

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// Create a separate instance for file uploads with extended timeout
export const createFileUploadRequest = (config = {}) => {
  return axios.create({
    baseURL: 'http://localhost:8000',
    timeout: 120000, // 2 minutes for file uploads
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    ...config
  });
};

// Helper function for file uploads
export const uploadFile = async (url, formData, options = {}) => {
  const uploadApi = createFileUploadRequest();
  
  // Add auth token
  const token = localStorage.getItem('token');
  if (token) {
    uploadApi.defaults.headers.Authorization = `Bearer ${token}`;
  }

  // Extract method from options, default to POST
  const { method = 'POST', onProgress, ...restOptions } = options;

  // Add progress callback if provided
  const config = {
    onUploadProgress: onProgress,
    ...restOptions
  };

  try {
    let response;
    if (method.toUpperCase() === 'PUT') {
      response = await uploadApi.put(url, formData, config);
    } else {
      response = await uploadApi.post(url, formData, config);
    }
    return response;
  } catch (error) {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/auth';
    }
    throw error;
  }
};

export default api;
