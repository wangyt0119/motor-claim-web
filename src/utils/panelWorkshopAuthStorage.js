const PANEL_WORKSHOP_SESSION_KEY = 'panelWorkshopPortalSession';

export function getPanelWorkshopSession() {
  window.localStorage.removeItem(PANEL_WORKSHOP_SESSION_KEY);
  const rawValue = window.sessionStorage.getItem(PANEL_WORKSHOP_SESSION_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    window.sessionStorage.removeItem(PANEL_WORKSHOP_SESSION_KEY);
    return null;
  }
}

export function savePanelWorkshopSession(session) {
  window.localStorage.removeItem(PANEL_WORKSHOP_SESSION_KEY);
  window.sessionStorage.setItem(PANEL_WORKSHOP_SESSION_KEY, JSON.stringify(session));
}

export function clearPanelWorkshopSession() {
  window.localStorage.removeItem(PANEL_WORKSHOP_SESSION_KEY);
  window.sessionStorage.removeItem(PANEL_WORKSHOP_SESSION_KEY);
}
