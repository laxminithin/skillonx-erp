import { AppError } from '../../utils/errors.js';
const OFFICE_CAPABILITIES = {
    OFFICE_ADMIN: ['request.view', 'request.process', 'assignment.manage', 'document.issue', 'register.manage', 'file.manage', 'finance.view'],
    OFFICE_SUPERINTENDENT: ['request.view', 'request.process', 'assignment.manage', 'document.issue', 'register.manage', 'file.manage', 'finance.view', 'analytics.view'],
    PRINCIPAL: ['request.view', 'analytics.view'],
    MANAGEMENT: ['analytics.view'],
    ACCOUNTANT: ['finance.view'],
    SUPER_ADMIN: ['service.configure'],
    HOD: [],
    FACULTY: [], STUDENT: [], COE: [], ADMISSIONS_OFFICER: [], LAB_ASSISTANT: [], MAINTENANCE: [], LIBRARIAN: [], WARDEN: [], TRANSPORT: [], 'T&P': [], HR: [],
};
export function hasOfficeCapability(role, capability) { return (OFFICE_CAPABILITIES[role] ?? []).includes(capability); }
export function assertOfficeCapability(role, capability) { if (!hasOfficeCapability(role, capability))
    throw new AppError(403, `Office capability denied: ${capability}`); }
