const CUSTOMER_SESSION_KEY = 'customerPortalSession';

export function getCustomerSession() {
  window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
  const rawValue = window.sessionStorage.getItem(CUSTOMER_SESSION_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    window.sessionStorage.removeItem(CUSTOMER_SESSION_KEY);
    return null;
  }
}

export function saveCustomerSession(session) {
  window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
  window.sessionStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(session));
}

export function clearCustomerSession() {
  window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
  window.sessionStorage.removeItem(CUSTOMER_SESSION_KEY);
}
