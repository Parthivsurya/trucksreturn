import { useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = '/api';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const request = useCallback(async (method, url, data = null, config = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios({
        method,
        url: `${API_URL}${url}`,
        data,
        headers: { ...getHeaders(), ...config.headers },
        ...config,
      });
      return res.data;
    } catch (err) {
      const message = err.response?.data?.error || err.message;
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  const get = useCallback((url, config) => request('GET', url, null, config), [request]);
  const post = useCallback((url, data, config) => request('POST', url, data, config), [request]);
  const put = useCallback((url, data, config) => request('PUT', url, data, config), [request]);
  const del = useCallback((url, config) => request('DELETE', url, null, config), [request]);

  return { get, post, put, del, loading, error };
}
