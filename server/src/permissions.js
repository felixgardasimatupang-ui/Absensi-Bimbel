export const roleAccessMap = {
  SUPER_ADMIN: {
    label: "Super Admin",
    canManageUsers: true,
    canManageMasterData: true,
    canManageAttendance: true,
    canCreateQr: true,
    canExportReports: true,
    canSendNotifications: true,
    canEvaluate: true,
    canViewAllEvaluations: true
  },
  ADMIN: {
    label: "Admin",
    canManageUsers: false,
    canManageMasterData: true,
    canManageAttendance: true,
    canCreateQr: true,
    canExportReports: true,
    canSendNotifications: true,
    canEvaluate: true,
    canViewAllEvaluations: true
  },
  STAFF: {
    label: "Staff",
    canManageUsers: false,
    canManageMasterData: true,
    canManageAttendance: true,
    canCreateQr: true,
    canExportReports: true,
    canSendNotifications: true,
    canEvaluate: false,
    canViewAllEvaluations: false
  },
  INSTRUCTOR: {
    label: "Instructor",
    canManageUsers: false,
    canManageMasterData: false,
    canManageAttendance: true,
    canCreateQr: true,
    canExportReports: false,
    canSendNotifications: false,
    canEvaluate: true,
    canViewAllEvaluations: false
  }
};

export const getRoleAccess = (role) => roleAccessMap[role] || null;
