const OFFICER_SESSION_KEY = 'officerPortalSession';

export function getOfficerSession() {
  const rawValue = window.localStorage.getItem(OFFICER_SESSION_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    window.localStorage.removeItem(OFFICER_SESSION_KEY);
    return null;
  }
}

export function saveOfficerSession(session) {
  window.localStorage.setItem(OFFICER_SESSION_KEY, JSON.stringify(session));
}

export function clearOfficerSession() {
  window.localStorage.removeItem(OFFICER_SESSION_KEY);
}
