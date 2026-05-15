import { useCallback } from 'react';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || '/api'}/admin`;

export function useAdminApi() {
  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const request = useCallback(async (method, url, data = null) => {
    try {
      const res = await axios({
        method,
        url: `${API_URL}${url}`,
        data,
        headers: getHeaders(),
      });
      return res.data;
    } catch (err) {
      const message = err.response?.data?.error || err.message;
      throw new Error(message);
    }
  }, [getHeaders]);

  return {
    get:  (url)       => request('GET',    url),
    post: (url, data) => request('POST',   url, data),
    put:  (url, data) => request('PUT',    url, data),
    del:  (url, data) => request('DELETE', url, data),
  };
}
