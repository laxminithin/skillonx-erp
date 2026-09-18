export type OfficeCapability = 'request.view' | 'request.process' | 'assignment.manage' | 'document.issue' | 'register.manage' | 'file.manage' | 'finance.view' | 'finance.mutate' | 'analytics.view' | 'service.configure';
export declare function hasOfficeCapability(role: string, capability: OfficeCapability): boolean;
export declare function assertOfficeCapability(role: string, capability: OfficeCapability): void;
