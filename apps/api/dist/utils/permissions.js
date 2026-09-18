export const FACULTY_PERMISSION_KEYS = [
    'createSurvey',
    'publishSurvey',
    'viewResponses',
    'exportReports',
    'manageQuestionBank',
    'viewStudentInformation',
];
export const DEFAULT_FACULTY_PERMISSIONS = {
    createSurvey: true,
    publishSurvey: true,
    viewResponses: true,
    exportReports: true,
    manageQuestionBank: true,
    viewStudentInformation: true,
};
export const ADMIN_ROLES = ['SUPER_ADMIN', 'COLLEGE_ADMIN'];
export const ROLE_LABELS = {
    SUPER_ADMIN: 'Platform Administrator',
    COLLEGE_ADMIN: 'College Administrator',
    FACULTY: 'Faculty',
    ACCOUNTANT: 'Accountant',
    ADMISSIONS_OFFICER: 'Admissions Officer',
    ADMISSIONS_MANAGER: 'Admissions Manager',
    COE: 'Controller of Examinations',
    OFFICE_ADMIN: 'Office Administrator',
    OFFICE_SUPERINTENDENT: 'Office Superintendent',
    HOD: 'Head of Department',
    PRINCIPAL: 'Principal',
    MANAGEMENT: 'Management',
    CHAIRMAN: 'Chairman',
    IQAC_COORDINATOR: 'IQAC Coordinator',
    NBA_COORDINATOR: 'NBA Coordinator',
    LAB_ASSISTANT: 'Lab Assistant',
    MAINTENANCE_MANAGER: 'Maintenance Manager',
    FACILITIES_OFFICER: 'Facilities Officer',
    MAINTENANCE_STAFF: 'Maintenance Technician',
    IT_SUPPORT: 'IT Support',
    STUDENT: 'Student',
    PARENT: 'Parent / Guardian',
};
export function isAdminRole(role) {
    return role === 'SUPER_ADMIN' || role === 'COLLEGE_ADMIN';
}
export function isSuperAdmin(role) {
    return role === 'SUPER_ADMIN';
}
export function parsePermissions(raw) {
    const base = { ...DEFAULT_FACULTY_PERMISSIONS };
    let obj = null;
    if (typeof raw === 'string') {
        try {
            obj = JSON.parse(raw);
        }
        catch {
            return base;
        }
    }
    else if (raw && typeof raw === 'object') {
        obj = raw;
    }
    if (!obj)
        return base;
    for (const key of FACULTY_PERMISSION_KEYS) {
        if (typeof obj[key] === 'boolean')
            base[key] = obj[key];
    }
    return base;
}
export function mergePermissions(overrides) {
    return { ...DEFAULT_FACULTY_PERMISSIONS, ...(overrides ?? {}) };
}
