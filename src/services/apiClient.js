import axios from 'axios';
import { getCustomerSession } from '../utils/authStorage';
import { getAdminSession } from '../utils/adminAuthStorage';
import { getOfficerSession } from '../utils/officerAuthStorage';
import { getPanelWorkshopSession } from '../utils/panelWorkshopAuthStorage';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:44352/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const pathname = window.location.pathname.toLowerCase();

  let session = null;

  if (pathname.startsWith('/panel-workshop')) {
    session = getPanelWorkshopSession() || getAdminSession() || getOfficerSession() || getCustomerSession();
  } else if (pathname.startsWith('/admin')) {
    session = getAdminSession() || getOfficerSession() || getPanelWorkshopSession() || getCustomerSession();
  } else if (pathname.startsWith('/officer')) {
    session = getOfficerSession() || getAdminSession() || getPanelWorkshopSession() || getCustomerSession();
  } else if (pathname.startsWith('/customer')) {
    session = getCustomerSession() || getAdminSession() || getOfficerSession() || getPanelWorkshopSession();
  } else {
    session = getAdminSession() || getCustomerSession() || getOfficerSession() || getPanelWorkshopSession();
  }

  const token = session?.token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default apiClient;
