import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole } from '../../utils/permissions.js';
import { assertWorkflowPermission } from './access.js';
import { WORKFLOW_ACTIONS } from './types.js';
const stepSchema = z.object({
    stepKey: z.string().trim().min(1).max(64),
    name: z.string().trim().min(1).max(191),
    allowedRoles: z.array(z.string().trim().min(1).max(64)).min(1).max(20),
    isInitial: z.boolean().optional(),
    isTerminal: z.boolean().optional(),
    terminalStatus: z.enum(['APPROVED', 'REJECTED', 'CANCELLED']).optional().nullable(),
}).strict();
const transitionSchema = z.object({
    fromStepKey: z.string().trim().min(1).max(64),
    action: z.enum(WORKFLOW_ACTIONS),
    toStepKey: z.string().trim().min(1).max(64),
}).strict();
export const createDefinitionSchema = z.object({
    code: z.string().trim().min(1).max(64),
    name: z.string().trim().min(1).max(191),
    entityType: z.string().trim().min(1).max(96),
    steps: z.array(stepSchema).min(2).max(30),
    transitions: z.array(transitionSchema).min(1).max(60),
}).strict();
export const startInstanceSchema = z.object({
    definitionCode: z.string().trim().min(1).max(64),
    entityType: z.string().trim().min(1).max(96),
    entityId: z.number().int().positive(),
}).strict();
export const actionSchema = z.object({
    action: z.enum(WORKFLOW_ACTIONS),
    remarks: z.string().trim().max(2000).optional().nullable(),
}).strict();
function n(value) {
    return Number(value ?? 0);
}
function shape(row) {
    return Object.fromEntries(Object.entries(row).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), v]));
}
export async function createDefinition(actor, input) {
    assertWorkflowPermission(actor, 'workflow.definition.manage');
    const initialSteps = input.steps.filter((s) => s.isInitial);
    if (initialSteps.length !== 1)
        throw new AppError(400, 'A workflow definition needs exactly one initial step');
    for (const step of input.steps) {
        if (step.isTerminal && !step.terminalStatus)
            throw new AppError(400, `Terminal step "${step.stepKey}" must declare a terminalStatus`);
    }
    const stepKeys = new Set(input.steps.map((s) => s.stepKey));
    if (stepKeys.size !== input.steps.length)
        throw new AppError(400, 'Step keys must be unique within a definition');
    for (const tr of input.transitions) {
        if (!stepKeys.has(tr.fromStepKey) || !stepKeys.has(tr.toStepKey))
            throw new AppError(400, 'Transition references an unknown step key');
    }
    return db.transaction(async (trx) => {
        const latest = await trx('workflow_definitions').where({ college_id: actor.collegeId, code: input.code }).orderBy('version', 'desc').first();
        const version = latest ? n(latest.version) + 1 : 1;
        const [definitionId] = await trx('workflow_definitions').insert({
            college_id: actor.collegeId,
            code: input.code,
            name: input.name,
            version,
            entity_type: input.entityType,
            is_active: false,
            created_by: actor.facultyUserId,
        });
        const stepIdByKey = new Map();
        for (const [i, step] of input.steps.entries()) {
            const [stepId] = await trx('workflow_steps').insert({
                college_id: actor.collegeId,
                definition_id: n(definitionId),
                step_key: step.stepKey,
                name: step.name,
                step_order: i,
                allowed_roles: JSON.stringify(step.allowedRoles),
                is_initial: !!step.isInitial,
                is_terminal: !!step.isTerminal,
                terminal_status: step.terminalStatus ?? null,
            });
            stepIdByKey.set(step.stepKey, n(stepId));
        }
        for (const tr of input.transitions) {
            await trx('workflow_transitions').insert({
                college_id: actor.collegeId,
                definition_id: n(definitionId),
                from_step_id: stepIdByKey.get(tr.fromStepKey),
                action: tr.action,
                to_step_id: stepIdByKey.get(tr.toStepKey),
            });
        }
        return getDefinition(actor, n(definitionId), trx);
    });
}
export async function getDefinition(actor, definitionId, trx = db) {
    assertWorkflowPermission(actor, 'workflow.instance.view');
    const definition = await trx('workflow_definitions').where({ id: definitionId, college_id: actor.collegeId }).first();
    if (!definition)
        throw new AppError(404, 'Workflow definition not found');
    const steps = await trx('workflow_steps').where({ definition_id: definitionId, college_id: actor.collegeId }).orderBy('step_order');
    const transitions = await trx('workflow_transitions').where({ definition_id: definitionId, college_id: actor.collegeId });
    return {
        ...shape(definition),
        steps: steps.map((s) => shape({ ...s, allowed_roles: typeof s.allowed_roles === 'string' ? JSON.parse(s.allowed_roles) : s.allowed_roles })),
        transitions: transitions.map(shape),
    };
}
export async function listDefinitions(actor) {
    assertWorkflowPermission(actor, 'workflow.instance.view');
    const rows = await db('workflow_definitions').where({ college_id: actor.collegeId }).orderBy(['code', { column: 'version', order: 'desc' }]);
    return rows.map(shape);
}
export async function publishDefinition(actor, definitionId) {
    assertWorkflowPermission(actor, 'workflow.definition.manage');
    return db.transaction(async (trx) => {
        const definition = await trx('workflow_definitions').where({ id: definitionId, college_id: actor.collegeId }).forUpdate().first();
        if (!definition)
            throw new AppError(404, 'Workflow definition not found');
        const initial = await trx('workflow_steps').where({ definition_id: definitionId, college_id: actor.collegeId, is_initial: true }).first();
        if (!initial)
            throw new AppError(400, 'Definition has no initial step and cannot be published');
        await trx('workflow_definitions').where({ id: definitionId }).update({ is_active: true, updated_at: trx.fn.now() });
        return getDefinition(actor, definitionId, trx);
    });
}
export async function startInstance(actor, input) {
    assertWorkflowPermission(actor, 'workflow.instance.start');
    const definition = await db('workflow_definitions')
        .where({ college_id: actor.collegeId, code: input.definitionCode, entity_type: input.entityType, is_active: true })
        .orderBy('version', 'desc')
        .first();
    if (!definition)
        throw new AppError(404, 'No active workflow definition found for this code/entity type');
    const initial = await db('workflow_steps').where({ definition_id: definition.id, college_id: actor.collegeId, is_initial: true }).first();
    if (!initial)
        throw new AppError(400, 'Workflow definition is misconfigured (no initial step)');
    return db.transaction(async (trx) => {
        const [instanceId] = await trx('workflow_instances').insert({
            college_id: actor.collegeId,
            definition_id: n(definition.id),
            definition_version: n(definition.version),
            entity_type: input.entityType,
            entity_id: input.entityId,
            current_step_id: n(initial.id),
            status: 'IN_PROGRESS',
            initiator_faculty_id: actor.facultyUserId,
        });
        await trx('workflow_instance_history').insert({
            college_id: actor.collegeId,
            instance_id: n(instanceId),
            from_step_id: null,
            action: 'SUBMIT',
            to_step_id: n(initial.id),
            actor_id: actor.facultyUserId,
            role_at_action: actor.role,
            remarks: null,
            previous_status: 'IN_PROGRESS',
            resulting_status: 'IN_PROGRESS',
        });
        return getInstance(actor, n(instanceId), trx);
    });
}
export async function performAction(actor, instanceId, input) {
    assertWorkflowPermission(actor, 'workflow.instance.act');
    return db.transaction(async (trx) => {
        const instance = await trx('workflow_instances').where({ id: instanceId, college_id: actor.collegeId }).forUpdate().first();
        if (!instance)
            throw new AppError(404, 'Workflow instance not found');
        if (instance.status !== 'IN_PROGRESS') {
            throw new AppError(400, `This workflow instance already reached a terminal state (${instance.status})`);
        }
        const currentStep = await trx('workflow_steps').where({ id: instance.current_step_id }).first();
        if (!currentStep)
            throw new AppError(500, 'Workflow instance references a missing step');
        const allowedRoles = typeof currentStep.allowed_roles === 'string' ? JSON.parse(currentStep.allowed_roles) : currentStep.allowed_roles;
        if (!isAdminRole(actor.role) && !allowedRoles.includes(actor.role)) {
            throw new AppError(403, 'Your role cannot act on this workflow step');
        }
        const transition = await trx('workflow_transitions')
            .where({ definition_id: instance.definition_id, from_step_id: instance.current_step_id, action: input.action })
            .first();
        if (!transition)
            throw new AppError(400, `Invalid transition: no "${input.action}" action from the current step`);
        const toStep = await trx('workflow_steps').where({ id: transition.to_step_id }).first();
        if (!toStep)
            throw new AppError(500, 'Workflow transition references a missing step');
        const resultingStatus = toStep.is_terminal ? String(toStep.terminal_status) : 'IN_PROGRESS';
        await trx('workflow_instances').where({ id: instanceId }).update({
            current_step_id: n(toStep.id),
            status: resultingStatus,
            completed_at: toStep.is_terminal ? trx.fn.now() : null,
            updated_at: trx.fn.now(),
        });
        await trx('workflow_instance_history').insert({
            college_id: actor.collegeId,
            instance_id: instanceId,
            from_step_id: n(currentStep.id),
            action: input.action,
            to_step_id: n(toStep.id),
            actor_id: actor.facultyUserId,
            role_at_action: actor.role,
            remarks: input.remarks ?? null,
            previous_status: 'IN_PROGRESS',
            resulting_status: resultingStatus,
        });
        return getInstance(actor, instanceId, trx);
    });
}
export async function getInstance(actor, instanceId, trx = db) {
    assertWorkflowPermission(actor, 'workflow.instance.view');
    const instance = await trx('workflow_instances').where({ id: instanceId, college_id: actor.collegeId }).first();
    if (!instance)
        throw new AppError(404, 'Workflow instance not found');
    const history = await trx('workflow_instance_history')
        .where({ college_id: actor.collegeId, instance_id: instanceId })
        .orderBy('id');
    return { ...shape(instance), history: history.map(shape) };
}
export async function listInstances(actor, filters = {}) {
    assertWorkflowPermission(actor, 'workflow.instance.view');
    let query = db('workflow_instances').where({ college_id: actor.collegeId });
    if (filters.entityType)
        query = query.andWhere({ entity_type: filters.entityType });
    if (filters.status)
        query = query.andWhere({ status: filters.status });
    const rows = await query.orderBy('id', 'desc').limit(500);
    return rows.map(shape);
}
