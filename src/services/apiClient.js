import axios from 'axios';
import { getCustomerSession } from '../utils/authStorage';
import { getAdminSession } from '../utils/adminAuthStorage';
import { getOfficerSession } from '../utils/officerAuthStorage';
import { getPanelWorkshopSession } from '../utils/panelWorkshopAuthStorage';
import { getStandalonePortalTarget, PORTAL_KEYS } from '../config/portalRoutes';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:44352/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const pathname = window.location.pathname.toLowerCase();
  const standaloneTarget = getStandalonePortalTarget();

  let session = null;

  if (standaloneTarget === PORTAL_KEYS.PANEL_WORKSHOP || pathname.startsWith('/panel-workshop')) {
    session = getPanelWorkshopSession();
  } else if (standaloneTarget === PORTAL_KEYS.ADMIN || pathname.startsWith('/admin')) {
    session = getAdminSession();
  } else if (standaloneTarget === PORTAL_KEYS.OFFICER || pathname.startsWith('/officer')) {
    session = getOfficerSession();
  } else if (standaloneTarget === PORTAL_KEYS.CUSTOMER || pathname.startsWith('/customer')) {
    session = getCustomerSession();
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
