export const USER_ROLE = {
  Customer: 1,
  Officer: 2,
  Admin: 3,
  PanelWorkshop: 4,
};

export function normalizeRole(role) {
  if (role === null || role === undefined) {
    return null;
  }

  if (typeof role === 'number') {
    return role;
  }

  const roleText = String(role).toLowerCase();

  if (roleText === 'customer') {
    return USER_ROLE.Customer;
  }

  if (roleText === 'officer') {
    return USER_ROLE.Officer;
  }

  if (roleText === 'admin') {
    return USER_ROLE.Admin;
  }

  if (roleText === 'panelworkshop' || roleText === 'panel workshop') {
    return USER_ROLE.PanelWorkshop;
  }

  const numericRole = Number(role);
  return Number.isNaN(numericRole) ? null : numericRole;
}
