const ADMIN_SESSION_KEY = 'adminPortalSession';

export function getAdminSession() {
  window.localStorage.removeItem(ADMIN_SESSION_KEY);
  const rawValue = window.sessionStorage.getItem(ADMIN_SESSION_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    return null;
  }
}

export function saveAdminSession(session) {
  window.localStorage.removeItem(ADMIN_SESSION_KEY);
  window.sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession() {
  window.localStorage.removeItem(ADMIN_SESSION_KEY);
  window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
}
