const PANEL_WORKSHOP_SESSION_KEY = 'panelWorkshopPortalSession';

export function getPanelWorkshopSession() {
  const rawValue = window.localStorage.getItem(PANEL_WORKSHOP_SESSION_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    window.localStorage.removeItem(PANEL_WORKSHOP_SESSION_KEY);
    return null;
  }
}

export function savePanelWorkshopSession(session) {
  window.localStorage.setItem(PANEL_WORKSHOP_SESSION_KEY, JSON.stringify(session));
}

export function clearPanelWorkshopSession() {
  window.localStorage.removeItem(PANEL_WORKSHOP_SESSION_KEY);
}
