import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { HrActor } from './types.js';
import { assertHrPermission } from './access.js';
import { recordHrAudit } from './audit.js';
import { ensureCollegeHrmsDefaults } from './defaults.js';

type Row = Record<string, unknown>;

export async function getAttendanceSettingsFull(actor: HrActor) {
  assertHrPermission(actor, 'hr.config.manage');
  await ensureCollegeHrmsDefaults(actor.collegeId);
  const row = await db('hr_attendance_settings').where({ college_id: actor.collegeId }).first();
  if (!row) {
    const schedule = await db('hr_work_schedules').where({ college_id: actor.collegeId, code: 'GENERAL' }).first();
    const [id] = await db('hr_attendance_settings').insert({
      college_id: actor.collegeId,
      default_work_schedule_id: schedule?.id ?? null,
      sandwich_leave_policy: 'DISABLED',
      late_marks_count_as_lop: false,
      auto_flag_missing_punch: true,
      missing_punch_grace_hours: 24,
      require_regularization_approval: true,
    });
    const created = await db('hr_attendance_settings').where({ id }).first();
    return serializeSettings(created!);
  }
  return serializeSettings(row);
}

function serializeSettings(row: Row) {
  return {
    id: Number(row.id),
    collegeId: Number(row.college_id),
    defaultWorkScheduleId: row.default_work_schedule_id ? Number(row.default_work_schedule_id) : null,
    defaultShiftId: row.default_shift_id ? Number(row.default_shift_id) : null,
    sandwichLeavePolicy: row.sandwich_leave_policy,
    lateMarksCountAsLop: !!row.late_marks_count_as_lop,
    autoFlagMissingPunch: !!row.auto_flag_missing_punch,
    missingPunchGraceHours: Number(row.missing_punch_grace_hours ?? 24),
    requireRegularizationApproval: !!row.require_regularization_approval,
    settingsJson: row.settings_json,
  };
}

export async function updateAttendanceSettings(actor: HrActor, input: Record<string, unknown>) {
  assertHrPermission(actor, 'hr.config.manage');
  await getAttendanceSettingsFull(actor);
  const updates: Row = {};
  if (input.defaultWorkScheduleId !== undefined) updates.default_work_schedule_id = input.defaultWorkScheduleId;
  if (input.defaultShiftId !== undefined) updates.default_shift_id = input.defaultShiftId;
  if (input.sandwichLeavePolicy !== undefined) updates.sandwich_leave_policy = input.sandwichLeavePolicy;
  if (input.lateMarksCountAsLop !== undefined) updates.late_marks_count_as_lop = input.lateMarksCountAsLop;
  if (input.autoFlagMissingPunch !== undefined) updates.auto_flag_missing_punch = input.autoFlagMissingPunch;
  if (input.missingPunchGraceHours !== undefined) updates.missing_punch_grace_hours = input.missingPunchGraceHours;
  if (input.requireRegularizationApproval !== undefined) updates.require_regularization_approval = input.requireRegularizationApproval;
  if (input.settingsJson !== undefined) updates.settings_json = JSON.stringify(input.settingsJson);

  await db('hr_attendance_settings').where({ college_id: actor.collegeId }).update(updates);
  await recordHrAudit({ actor, action: 'ATTENDANCE_SETTINGS_UPDATED', entityType: 'hr_attendance_settings', entityId: actor.collegeId, after: updates });
  return getAttendanceSettingsFull(actor);
}

export async function listShifts(actor: HrActor) {
  assertHrPermission(actor, 'hr.config.manage');
  const rows = await db('hr_shifts').where({ college_id: actor.collegeId }).orderBy('code');
  return rows.map(serializeShift);
}

function serializeShift(row: Row) {
  return {
    id: Number(row.id),
    code: row.code,
    name: row.name,
    startTime: String(row.start_time).slice(0, 8),
    endTime: String(row.end_time).slice(0, 8),
    breakDurationMinutes: Number(row.break_duration_minutes ?? 0),
    graceInMinutes: Number(row.grace_in_minutes ?? 15),
    graceOutMinutes: Number(row.grace_out_minutes ?? 0),
    lateThresholdMinutes: Number(row.late_threshold_minutes ?? 0),
    earlyOutThresholdMinutes: Number(row.early_out_threshold_minutes ?? 0),
    minimumFullDayMinutes: Number(row.minimum_full_day_minutes ?? 480),
    minimumHalfDayMinutes: Number(row.minimum_half_day_minutes ?? 240),
    crossesMidnight: !!row.crosses_midnight,
    isActive: !!row.is_active,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
  };
}

export async function createShift(actor: HrActor, input: Record<string, unknown>) {
  assertHrPermission(actor, 'hr.config.manage');
  const [id] = await db('hr_shifts').insert({
    college_id: actor.collegeId,
    code: input.code,
    name: input.name,
    start_time: input.startTime,
    end_time: input.endTime,
    break_duration_minutes: input.breakDurationMinutes ?? 0,
    grace_in_minutes: input.graceInMinutes ?? 15,
    grace_out_minutes: input.graceOutMinutes ?? 0,
    late_threshold_minutes: input.lateThresholdMinutes ?? 0,
    early_out_threshold_minutes: input.earlyOutThresholdMinutes ?? 0,
    minimum_full_day_minutes: input.minimumFullDayMinutes ?? 480,
    minimum_half_day_minutes: input.minimumHalfDayMinutes ?? 240,
    crosses_midnight: input.crossesMidnight ?? false,
    effective_from: input.effectiveFrom ?? null,
    effective_to: input.effectiveTo ?? null,
    is_active: true,
  });
  await recordHrAudit({ actor, action: 'SHIFT_CREATED', entityType: 'hr_shifts', entityId: id });
  const row = await db('hr_shifts').where({ id }).first();
  return serializeShift(row!);
}

export async function updateShift(actor: HrActor, shiftId: number, input: Record<string, unknown>) {
  assertHrPermission(actor, 'hr.config.manage');
  const row = await db('hr_shifts').where({ id: shiftId, college_id: actor.collegeId }).first();
  if (!row) throw new AppError(404, 'Shift not found');
  const updates: Row = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.startTime !== undefined) updates.start_time = input.startTime;
  if (input.endTime !== undefined) updates.end_time = input.endTime;
  if (input.breakDurationMinutes !== undefined) updates.break_duration_minutes = input.breakDurationMinutes;
  if (input.graceInMinutes !== undefined) updates.grace_in_minutes = input.graceInMinutes;
  if (input.graceOutMinutes !== undefined) updates.grace_out_minutes = input.graceOutMinutes;
  if (input.minimumFullDayMinutes !== undefined) updates.minimum_full_day_minutes = input.minimumFullDayMinutes;
  if (input.minimumHalfDayMinutes !== undefined) updates.minimum_half_day_minutes = input.minimumHalfDayMinutes;
  if (input.crossesMidnight !== undefined) updates.crosses_midnight = input.crossesMidnight;
  if (input.isActive !== undefined) updates.is_active = input.isActive;
  await db('hr_shifts').where({ id: shiftId }).update(updates);
  await recordHrAudit({ actor, action: 'SHIFT_UPDATED', entityType: 'hr_shifts', entityId: shiftId, after: updates });
  return serializeShift({ ...row, ...updates });
}

export async function assignShift(actor: HrActor, employeeId: number, input: { shiftId: number; effectiveFrom: string; effectiveTo?: string | null; source?: string; remarks?: string }) {
  assertHrPermission(actor, 'hr.attendance.manage');
  const emp = await db('employees').where({ id: employeeId, college_id: actor.collegeId }).first();
  if (!emp) throw new AppError(404, 'Employee not found');
  const [id] = await db('employee_shift_assignments').insert({
    employee_id: employeeId,
    shift_id: input.shiftId,
    effective_from: input.effectiveFrom,
    effective_to: input.effectiveTo ?? null,
    college_id: actor.collegeId,
    source: input.source ?? 'HR',
    remarks: input.remarks ?? null,
  });
  await recordHrAudit({ actor, action: 'SHIFT_ASSIGNED', entityType: 'employee_shift_assignments', entityId: id, after: input });
  return { id: Number(id) };
}

export async function listWorkSchedules(actor: HrActor) {
  assertHrPermission(actor, 'hr.config.manage');
  const rows = await db('hr_work_schedules').where({ college_id: actor.collegeId }).orderBy('code');
  return rows.map((r: Row) => ({
    id: Number(r.id),
    code: r.code,
    name: r.name,
    workingDays: typeof r.working_days === 'string' ? JSON.parse(r.working_days) : r.working_days,
    weeklyOff: r.weekly_off ? (typeof r.weekly_off === 'string' ? JSON.parse(r.weekly_off) : r.weekly_off) : [],
    startTime: String(r.start_time).slice(0, 8),
    endTime: String(r.end_time).slice(0, 8),
    graceMinutes: Number(r.grace_minutes ?? 15),
    halfDayThresholdMinutes: Number(r.half_day_threshold_minutes ?? 240),
    fullDayMinutes: Number(r.full_day_minutes ?? 480),
    isActive: !!r.is_active,
  }));
}

export async function updateWorkSchedule(actor: HrActor, scheduleId: number, input: Record<string, unknown>) {
  assertHrPermission(actor, 'hr.config.manage');
  const row = await db('hr_work_schedules').where({ id: scheduleId, college_id: actor.collegeId }).first();
  if (!row) throw new AppError(404, 'Work schedule not found');
  const updates: Row = {};
  if (input.workingDays !== undefined) updates.working_days = JSON.stringify(input.workingDays);
  if (input.weeklyOff !== undefined) updates.weekly_off = JSON.stringify(input.weeklyOff);
  if (input.startTime !== undefined) updates.start_time = input.startTime;
  if (input.endTime !== undefined) updates.end_time = input.endTime;
  if (input.graceMinutes !== undefined) updates.grace_minutes = input.graceMinutes;
  if (input.halfDayThresholdMinutes !== undefined) updates.half_day_threshold_minutes = input.halfDayThresholdMinutes;
  if (input.fullDayMinutes !== undefined) updates.full_day_minutes = input.fullDayMinutes;
  if (input.isActive !== undefined) updates.is_active = input.isActive;
  await db('hr_work_schedules').where({ id: scheduleId }).update(updates);
  await recordHrAudit({ actor, action: 'WORK_SCHEDULE_UPDATED', entityType: 'hr_work_schedules', entityId: scheduleId, after: updates });
  return listWorkSchedules(actor).then((list) => list.find((s) => s.id === scheduleId));
}

export async function listHolidays(actor: HrActor, year?: number) {
  assertHrPermission(actor, 'hr.attendance.view');
  let q = db('hr_attendance_holidays').where({ college_id: actor.collegeId });
  if (year) q = q.andWhereRaw('YEAR(holiday_date) = ?', [year]);
  const rows = await q.orderBy('holiday_date');
  return rows.map(serializeHoliday);
}

function serializeHoliday(row: Row) {
  return {
    id: Number(row.id),
    name: row.name,
    holidayDate: row.holiday_date,
    holidayType: row.holiday_type,
    description: row.description,
    departmentId: row.department_id ? Number(row.department_id) : null,
    employeeCategory: row.employee_category,
    isActive: !!row.is_active,
  };
}

export async function createHoliday(actor: HrActor, input: Record<string, unknown>) {
  assertHrPermission(actor, 'hr.config.manage');
  const [id] = await db('hr_attendance_holidays').insert({
    college_id: actor.collegeId,
    name: input.name,
    holiday_date: input.holidayDate,
    holiday_type: input.holidayType ?? 'INSTITUTION',
    description: input.description ?? null,
    department_id: input.departmentId ?? null,
    employee_category: input.employeeCategory ?? null,
    is_active: true,
  });
  await recordHrAudit({ actor, action: 'HOLIDAY_CREATED', entityType: 'hr_attendance_holidays', entityId: id });
  const row = await db('hr_attendance_holidays').where({ id }).first();
  return serializeHoliday(row!);
}

export async function updateHoliday(actor: HrActor, holidayId: number, input: Record<string, unknown>) {
  assertHrPermission(actor, 'hr.config.manage');
  const row = await db('hr_attendance_holidays').where({ id: holidayId, college_id: actor.collegeId }).first();
  if (!row) throw new AppError(404, 'Holiday not found');
  const updates: Row = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.holidayDate !== undefined) updates.holiday_date = input.holidayDate;
  if (input.holidayType !== undefined) updates.holiday_type = input.holidayType;
  if (input.description !== undefined) updates.description = input.description;
  if (input.isActive !== undefined) updates.is_active = input.isActive;
  await db('hr_attendance_holidays').where({ id: holidayId }).update(updates);
  await recordHrAudit({ actor, action: 'HOLIDAY_UPDATED', entityType: 'hr_attendance_holidays', entityId: holidayId, after: updates });
  return serializeHoliday({ ...row, ...updates });
}

export async function ensureDefaultShift(collegeId: number) {
  const existing = await db('hr_shifts').where({ college_id: collegeId, code: 'GENERAL' }).first();
  if (existing) return Number(existing.id);
  const schedule = await db('hr_work_schedules').where({ college_id: collegeId, code: 'GENERAL' }).first();
  const [id] = await db('hr_shifts').insert({
    college_id: collegeId,
    code: 'GENERAL',
    name: 'General Day Shift',
    start_time: schedule?.start_time ?? '09:00:00',
    end_time: schedule?.end_time ?? '17:00:00',
    minimum_full_day_minutes: schedule?.full_day_minutes ?? 480,
    minimum_half_day_minutes: schedule?.half_day_threshold_minutes ?? 240,
    grace_in_minutes: schedule?.grace_minutes ?? 15,
    is_active: true,
  });
  const settings = await db('hr_attendance_settings').where({ college_id: collegeId }).first();
  if (settings && !settings.default_shift_id) {
    await db('hr_attendance_settings').where({ id: settings.id }).update({ default_shift_id: id });
  }
  return Number(id);
}
