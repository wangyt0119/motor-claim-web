import axios from 'axios';
import { getCustomerSession } from '../utils/authStorage';
import { getOfficerSession } from '../utils/officerAuthStorage';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:44352/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const session = getCustomerSession() || getOfficerSession();
  const token = session?.token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default apiClient;
