import { clearAdminSession } from './adminAuthStorage';
import { clearCustomerSession } from './authStorage';
import { clearOfficerSession } from './officerAuthStorage';
import { clearPanelWorkshopSession } from './panelWorkshopAuthStorage';

export function clearAllPortalSessions() {
  clearCustomerSession();
  clearOfficerSession();
  clearAdminSession();
  clearPanelWorkshopSession();
}
