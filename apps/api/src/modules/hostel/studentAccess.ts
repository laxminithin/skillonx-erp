import { db } from '../../db/index.js';
import type { HostelVisibility } from './types.js';
import { getOpenApplicationCycle } from './eligibility.js';

export async function getStudentHostelAccess(studentId: number, collegeId: number) {
  if (!(await db.schema.hasTable('hostel_applications'))) {
    return {
      visibility: 'HIDDEN' as HostelVisibility,
      canApply: false,
      canAccessResidentFeatures: false,
    };
  }

  const activeResident = await db('hostel_residents')
    .where({ student_id: studentId, college_id: collegeId })
    .whereIn('status', ['ACTIVE', 'TEMPORARILY_AWAY'])
    .first();

  if (activeResident) {
    const allocation = await db('hostel_bed_allocations')
      .where({ resident_id: activeResident.id, status: 'ACTIVE' })
      .first();
    return {
      visibility: 'RESIDENT' as HostelVisibility,
      canApply: false,
      residentId: Number(activeResident.id),
      hostelId: Number(activeResident.hostel_id),
      currentAllocationId: allocation ? Number(allocation.id) : undefined,
      canAccessResidentFeatures: true,
    };
  }

  const vacatingResident = await db('hostel_residents')
    .where({ student_id: studentId, college_id: collegeId, status: 'VACATING' })
    .first();

  if (vacatingResident) {
    const allocation = await db('hostel_bed_allocations')
      .where({ resident_id: vacatingResident.id, status: 'ACTIVE' })
      .first();
    return {
      visibility: 'VACATING' as HostelVisibility,
      canApply: false,
      residentId: Number(vacatingResident.id),
      hostelId: Number(vacatingResident.hostel_id),
      currentAllocationId: allocation ? Number(allocation.id) : undefined,
      canAccessResidentFeatures: false,
    };
  }

  const formerResident = await db('hostel_residents')
    .where({ student_id: studentId, college_id: collegeId, status: 'VACATED' })
    .orderBy('vacated_at', 'desc')
    .first();

  const application = await db('hostel_applications')
    .where({ student_id: studentId, college_id: collegeId })
    .whereNotIn('status', ['REJECTED', 'CANCELLED'])
    .orderBy('created_at', 'desc')
    .first();

  if (application) {
    const waitlisted = await db('hostel_waitlist_entries')
      .where({ application_id: application.id, status: 'ACTIVE' })
      .first();

    if (waitlisted) {
      return {
        visibility: 'WAITLISTED' as HostelVisibility,
        canApply: false,
        applicationId: Number(application.id),
        canAccessResidentFeatures: false,
      };
    }

    if (application.status === 'DRAFT') {
      return {
        visibility: 'APPLICATION_DRAFT' as HostelVisibility,
        canApply: true,
        applicationId: Number(application.id),
        canAccessResidentFeatures: false,
      };
    }

    if (['SUBMITTED', 'UNDER_REVIEW'].includes(application.status)) {
      return {
        visibility: 'APPLICATION_PENDING' as HostelVisibility,
        canApply: false,
        applicationId: Number(application.id),
        canAccessResidentFeatures: false,
      };
    }

    if (application.status === 'APPROVED') {
      const resident = await db('hostel_residents')
        .where({ application_id: application.id, college_id: collegeId })
        .whereNot('status', 'CANCELLED')
        .first();
      if (!resident || resident.status === 'CANCELLED') {
        return {
          visibility: 'ALLOCATION_PENDING' as HostelVisibility,
          canApply: false,
          applicationId: Number(application.id),
          canAccessResidentFeatures: false,
        };
      }
      return {
        visibility: 'APPROVED' as HostelVisibility,
        canApply: false,
        applicationId: Number(application.id),
        residentId: Number(resident.id),
        canAccessResidentFeatures: false,
      };
    }

    if (application.status === 'ALLOCATED') {
      return {
        visibility: 'ALLOCATION_PENDING' as HostelVisibility,
        canApply: false,
        applicationId: Number(application.id),
        canAccessResidentFeatures: false,
      };
    }
  }

  if (formerResident) {
    return {
      visibility: 'FORMER_RESIDENT' as HostelVisibility,
      canApply: false,
      residentId: Number(formerResident.id),
      canAccessResidentFeatures: false,
    };
  }

  const openCycle = await getOpenApplicationCycle(collegeId);
  if (openCycle) {
    return {
      visibility: 'APPLICATION_AVAILABLE' as HostelVisibility,
      canApply: true,
      canAccessResidentFeatures: false,
    };
  }

  return {
    visibility: 'HIDDEN' as HostelVisibility,
    canApply: false,
    canAccessResidentFeatures: false,
  };
}
