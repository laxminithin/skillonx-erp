import { db } from '../../db/index.js';
import { assertActiveResident, assertHostelPermission } from './access.js';
export async function getStudentMess(studentId, collegeId) {
    const resident = await assertActiveResident(studentId, collegeId);
    const assignment = await db('resident_mess_assignments as rma')
        .join('mess_plans as mp', 'mp.id', 'rma.mess_plan_id')
        .where({ 'rma.resident_id': resident.id, 'rma.status': 'ACTIVE' })
        .select('mp.*', 'rma.start_at')
        .first();
    return {
        messPlan: assignment
            ? { id: Number(assignment.id), name: assignment.name, planType: assignment.plan_type, monthlyAmount: assignment.monthly_amount }
            : null,
        assignmentStartAt: assignment?.start_at ?? null,
    };
}
export async function getMessMenu(collegeId, hostelId, date) {
    const targetDate = date ?? new Date().toISOString().slice(0, 10);
    let cycleQ = db('mess_menu_cycles')
        .where({ college_id: collegeId, status: 'ACTIVE' })
        .where('week_start', '<=', targetDate)
        .where('week_end', '>=', targetDate);
    if (hostelId)
        cycleQ = cycleQ.andWhere('hostel_id', hostelId);
    const cycle = await cycleQ.first();
    if (!cycle)
        return { date: targetDate, meals: [] };
    const items = await db('mess_menu_items')
        .where({ menu_cycle_id: cycle.id, menu_date: targetDate })
        .orderBy('meal_type');
    return {
        date: targetDate,
        cycleName: cycle.name,
        meals: items.map((i) => ({
            mealType: i.meal_type,
            items: i.items,
            timing: i.timing,
        })),
    };
}
export async function getWeeklyMenu(collegeId, hostelId) {
    const today = new Date();
    const meals = [];
    for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() + d);
        const dateStr = date.toISOString().slice(0, 10);
        const menu = await getMessMenu(collegeId, hostelId, dateStr);
        meals.push(menu);
    }
    return meals;
}
export async function submitMessFeedback(studentId, collegeId, input) {
    const resident = await assertActiveResident(studentId, collegeId);
    const [id] = await db('mess_feedback').insert({
        college_id: collegeId,
        resident_id: resident.id,
        student_id: studentId,
        meal_date: input.mealDate,
        meal_type: input.mealType,
        rating: input.rating,
        category: input.category ?? null,
        comment: input.comment ?? null,
    });
    return { id, status: 'SUBMITTED' };
}
export async function listMessPlans(actor, hostelId) {
    assertHostelPermission(actor, 'hostel.mess.manage');
    let q = db('mess_plans').where({ college_id: actor.collegeId, status: 'ACTIVE' });
    if (hostelId)
        q = q.andWhere('hostel_id', hostelId);
    const rows = await q.orderBy('name');
    return rows.map((r) => ({
        id: Number(r.id),
        name: r.name,
        planType: r.plan_type,
        monthlyAmount: r.monthly_amount != null ? Number(r.monthly_amount) : null,
        hostelId: r.hostel_id ? Number(r.hostel_id) : null,
    }));
}
export async function createMessPlan(actor, input) {
    assertHostelPermission(actor, 'hostel.mess.manage');
    const [id] = await db('mess_plans').insert({
        college_id: actor.collegeId,
        hostel_id: input.hostelId ?? null,
        name: input.name,
        plan_type: input.planType,
        monthly_amount: input.monthlyAmount ?? null,
        status: 'ACTIVE',
    });
    return { id, name: input.name, planType: input.planType };
}
