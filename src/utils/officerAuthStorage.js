const OFFICER_SESSION_KEY = 'officerPortalSession';

export function getOfficerSession() {
  window.localStorage.removeItem(OFFICER_SESSION_KEY);
  const rawValue = window.sessionStorage.getItem(OFFICER_SESSION_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    window.sessionStorage.removeItem(OFFICER_SESSION_KEY);
    return null;
  }
}

export function saveOfficerSession(session) {
  window.localStorage.removeItem(OFFICER_SESSION_KEY);
  window.sessionStorage.setItem(OFFICER_SESSION_KEY, JSON.stringify(session));
}

export function clearOfficerSession() {
  window.localStorage.removeItem(OFFICER_SESSION_KEY);
  window.sessionStorage.removeItem(OFFICER_SESSION_KEY);
}
