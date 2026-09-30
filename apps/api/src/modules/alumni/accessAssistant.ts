/**
 * Access control for Alumni Intelligence Assistant (C8).
 */
import { isAdminRole } from '../../utils/permissions.js';
import type { AlumniAdminActor } from './service.js';
import { canAccessCrm } from './accessCrm.js';
import { canAccessImpact } from './accessImpact.js';
import { canViewIntelligence } from './accessIntelligence.js';
import { canAccessMatching } from './accessMatching.js';
import { canAccessRecognition } from './accessRecognition.js';
import { canAccessEngagement } from './accessEngagement.js';

const ASSISTANT_ROLES = [
  'SUPER_ADMIN',
  'COLLEGE_ADMIN',
  'PRINCIPAL',
  'MANAGEMENT',
  'CHAIRMAN',
  'VICE_PRINCIPAL',
  'DEAN',
  'ALUMNI_COORDINATOR',
  'HOD',
  'FACULTY',
  'TNP_OFFICER',
  'PLACEMENT_OFFICER',
  'TRAINING_PLACEMENT',
  'TPO',
  'IQAC_COORDINATOR',
  'NBA_COORDINATOR',
] as const;

export function canAccessAssistant(actor: AlumniAdminActor) {
  return (
    ASSISTANT_ROLES.includes(actor.role as any) ||
    canAccessCrm(actor) ||
    canViewIntelligence(actor) ||
    canAccessEngagement(actor) ||
    canAccessMatching(actor) ||
    canAccessRecognition(actor) ||
    canAccessImpact(actor) ||
    isAdminRole(actor.role)
  );
}

export function canProposeAssistantDrafts(actor: AlumniAdminActor) {
  return (
    ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'ALUMNI_COORDINATOR', 'PRINCIPAL', 'TNP_OFFICER', 'PLACEMENT_OFFICER', 'TPO'].includes(
      actor.role,
    ) || isAdminRole(actor.role)
  );
}

export function canViewAssistantInternalNotes(actor: AlumniAdminActor) {
  return (
    ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'ALUMNI_COORDINATOR', 'PRINCIPAL'].includes(actor.role) || isAdminRole(actor.role)
  );
}

export function isDepartmentScopedAssistant(actor: AlumniAdminActor) {
  return ['HOD', 'FACULTY'].includes(actor.role) && !isAdminRole(actor.role);
}

export function toolPermissionAllowed(actor: AlumniAdminActor, required: string): boolean {
  if (!canAccessAssistant(actor)) return false;
  switch (required) {
    case 'alumni.assistant':
      return true;
    case 'alumni.360':
      return canAccessCrm(actor) || canViewIntelligence(actor) || isAdminRole(actor.role);
    case 'alumni.crm':
      return canAccessCrm(actor);
    case 'alumni.intelligence':
      return canViewIntelligence(actor);
    case 'alumni.matching':
      return canAccessMatching(actor);
    case 'alumni.engagement':
      return canAccessEngagement(actor);
    case 'alumni.recognition':
      return canAccessRecognition(actor);
    case 'alumni.impact':
      return canAccessImpact(actor);
    case 'alumni.assistant.propose':
      return canProposeAssistantDrafts(actor);
    default:
      return false;
  }
}
