const TARGET_APP = process.env.REACT_APP_TARGET_APP || 'main';

export const PORTAL_KEYS = {
  CUSTOMER: 'customer',
  OFFICER: 'officer',
  ADMIN: 'admin',
  PANEL_WORKSHOP: 'panel-workshop',
};

export function isStandalonePortal(portalKey) {
  return TARGET_APP === portalKey;
}

export function getPortalBasePath(portalKey) {
  return isStandalonePortal(portalKey) ? '' : `/${portalKey}`;
}

export function getPortalPath(portalKey, childPath = '') {
  const normalizedChildPath = childPath
    ? childPath.startsWith('/')
      ? childPath
      : `/${childPath}`
    : '';
  const basePath = getPortalBasePath(portalKey);
  const fullPath = `${basePath}${normalizedChildPath}`;

  return fullPath || '/';
}

export function getStandalonePortalTarget() {
  return TARGET_APP;
}
