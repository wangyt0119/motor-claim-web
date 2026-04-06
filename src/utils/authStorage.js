const CUSTOMER_SESSION_KEY = 'customerPortalSession';

export function getCustomerSession() {
  const rawValue = window.localStorage.getItem(CUSTOMER_SESSION_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
    return null;
  }
}

export function saveCustomerSession(session) {
  window.localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(session));
}

export function clearCustomerSession() {
  window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
}
