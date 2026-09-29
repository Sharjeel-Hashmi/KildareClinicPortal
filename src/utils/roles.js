// Role helpers — one place for "who can do what" so the UI stays consistent.
//   super_admin : full control; only role that can delete records, edit invoices, create Admins
//   admin       : creates/manages doctor accounts, edits everything except invoices, no deletes
//   doctor      : works with their own patients/consultations, no deletes

export const isSuperAdmin = (user) => user?.role === 'super_admin';

// Admin or Super Admin
export const isAdminLike = (user) => user?.role === 'admin' || user?.role === 'super_admin';

export const ROLE_LABEL = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  doctor: 'Doctor',
};

export const roleLabel = (role) => ROLE_LABEL[role] || 'Doctor';