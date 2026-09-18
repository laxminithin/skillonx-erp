import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { HrActor } from './types.js';
import { assertHrPermission } from './access.js';
import { recordHrAudit } from './audit.js';
import { createEmployeeRecord, type CreateEmployeeInput } from './lifecycleEmployee.js';
import { completeJoiningSchema } from './recruitmentTypes.js';
import { loadApplication, serializeApplication } from './recruitmentApplications.js';
import { getAcceptedValidOffer } from './recruitmentOffers.js';
import { assertJoiningReady } from './recruitmentPreJoining.js';
import { assertHeadcountAvailable } from './recruitmentOpenings.js';
import { notifyCandidate } from './recruitmentNotify.js';
import { asYmd } from './recruitmentAccess.js';

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], middleName: null as string | null, lastName: parts[0] };
  if (parts.length === 2) return { firstName: parts[0], middleName: null as string | null, lastName: parts[1] };
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
}

/**
 * Convert accepted candidate → employee via lifecycle createEmployeeRecord.
 * Idempotent on application_id. Does NOT create a second employee master.
 * Offer acceptance alone does NOT create an employee.
 */
export async function completeJoining(actor: HrActor, applicationId: number, opts?: unknown) {
  assertHrPermission(actor, 'hr.recruitment.join');
  const input = completeJoiningSchema.parse(opts ?? {});
  const app = await loadApplication(actor, applicationId);

  if (app.employee_id) {
    const emp = await db('employees').where({ id: app.employee_id }).first();
    return {
      idempotent: true,
      application: serializeApplication(app, actor),
      employee: emp
        ? {
            id: Number(emp.id),
            employeeNumber: emp.employee_number,
            employmentStatus: emp.employment_status,
          }
        : null,
    };
  }

  if (!['ACCEPTED', 'PRE_JOINING'].includes(String(app.status))) {
    throw new AppError(
      400,
      'Application must be ACCEPTED or PRE_JOINING to complete joining',
      undefined,
      'APPLICATION_NOT_JOINABLE',
    );
  }

  const offer = await getAcceptedValidOffer(applicationId, actor.collegeId);
  if (!offer) {
    throw new AppError(400, 'No accepted offer found for application', undefined, 'OFFER_NOT_ACCEPTED');
  }

  await assertJoiningReady(applicationId, actor.collegeId);

  const candidate = await db('hr_recruitment_candidates')
    .where({ id: app.candidate_id, college_id: actor.collegeId })
    .first();
  if (!candidate) throw new AppError(404, 'Candidate not found');

  const name = splitName(String(candidate.full_name));
  const createInput: CreateEmployeeInput = {
    firstName: name.firstName,
    middleName: name.middleName,
    lastName: name.lastName,
    officialEmail: String(candidate.email),
    officialPhone: candidate.phone ? String(candidate.phone) : null,
    employeeCategory: input.employeeCategory ?? 'NON_TEACHING',
    departmentId: Number(offer.department_id),
    designationId: Number(offer.designation_id),
    employmentTypeId: Number(offer.employment_type_id),
    dateOfJoining: offer.proposed_joining_date
      ? asYmd(offer.proposed_joining_date)
      : new Date().toISOString().slice(0, 10),
    employmentStatus: 'PRE_JOINING',
    authMode: input.authMode ?? 'NO_LOGIN',
  };

  return db.transaction(async (trx) => {
    // Re-check idempotency under lock
    const lockedApp = await trx('hr_recruitment_applications').where({ id: applicationId }).forUpdate().first();
    if (!lockedApp) throw new AppError(404, 'Application not found');
    if (lockedApp.employee_id) {
      const emp = await trx('employees').where({ id: lockedApp.employee_id }).first();
      return {
        idempotent: true,
        application: serializeApplication(lockedApp, actor),
        employee: emp
          ? {
              id: Number(emp.id),
              employeeNumber: emp.employee_number,
              employmentStatus: emp.employment_status,
            }
          : null,
      };
    }

    const { opening, joined } = await assertHeadcountAvailable(trx, Number(lockedApp.opening_id));

    const employee = await createEmployeeRecord(actor, createInput, trx);
    const employeeId = Number(employee.id);

    await trx('hr_recruitment_applications').where({ id: applicationId }).update({
      employee_id: employeeId,
      status: 'JOINED',
      joined_at: trx.fn.now(),
    });

    const newJoined = joined + 1;
    const openingUpdate: Record<string, unknown> = { joined_count: newJoined };
    if (newJoined >= Number(opening.headcount)) {
      openingUpdate.status = 'FILLED';
    }
    await trx('hr_job_openings').where({ id: opening.id }).update(openingUpdate);

    if (opening.requisition_id) {
      const reqOpenings = await trx('hr_job_openings')
        .where({ requisition_id: opening.requisition_id })
        .whereNotIn('status', ['CANCELLED']);
      const totalHeadcount = reqOpenings.reduce((s, o) => s + Number(o.headcount), 0);
      const totalJoined = reqOpenings.reduce((s, o) => {
        const jc = Number(o.id) === Number(opening.id) ? newJoined : Number(o.joined_count ?? 0);
        return s + jc;
      }, 0);
      const req = await trx('hr_recruitment_requisitions').where({ id: opening.requisition_id }).first();
      const approved = Number(req?.approved_headcount ?? req?.requested_headcount ?? totalHeadcount);
      if (totalJoined >= approved && req && ['OPENED', 'APPROVED'].includes(String(req.status))) {
        await trx('hr_recruitment_requisitions').where({ id: opening.requisition_id }).update({ status: 'CLOSED' });
      }
    }

    await recordHrAudit({
      actor,
      action: 'RECRUITMENT_JOINING_COMPLETED',
      entityType: 'hr_recruitment_applications',
      entityId: applicationId,
      after: { employeeId, openingId: opening.id, joinedCount: newJoined },
    });

    await notifyCandidate({
      candidateId: Number(candidate.id),
      collegeId: actor.collegeId,
      type: 'JOINING_COMPLETED',
      title: 'Welcome — joining completed',
      body: `Your employee number is ${employee.employeeNumber}.`,
      relatedType: 'employees',
      relatedId: employeeId,
      dedupeKey: `join-${applicationId}`,
    });

    const refreshed = await trx('hr_recruitment_applications').where({ id: applicationId }).first();
    return {
      idempotent: false,
      application: serializeApplication(refreshed!, actor),
      employee: {
        id: employeeId,
        employeeNumber: employee.employeeNumber,
        employmentStatus: employee.employmentStatus,
      },
    };
  });
}

export async function convertCandidateToEmployee(
  actor: HrActor,
  applicationId: number,
  opts?: unknown,
) {
  return completeJoining(actor, applicationId, opts);
}
