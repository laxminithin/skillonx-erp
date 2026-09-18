import { db } from '../../db/index.js';
import { SKILLONX_STANDARD_V1 } from './policy.js';
import { FORMULA_VERSION, STANDARD_CODE } from './types.js';
import { ACTIONS, CAUSE_ACTION_LINKS, EVIDENCE_TEMPLATES, PO_ACTIONS, ROOT_CAUSES } from './libraries.js';
export async function ensureAcademicStandardAndLibraries() {
    if (!(await db.schema.hasTable('academic_standards')))
        return;
    const existing = await db('academic_standards').where({ code: STANDARD_CODE, scope_key: 'PLATFORM' }).first();
    let standardId = existing ? Number(existing.id) : 0;
    if (!existing) {
        const ids = await db('academic_standards').insert({
            code: STANDARD_CODE,
            name: SKILLONX_STANDARD_V1.name,
            scope: 'PLATFORM',
            scope_key: 'PLATFORM',
            college_id: null,
            program_id: null,
            course_id: null,
            is_active: true,
        });
        standardId = Number(ids[0]);
    }
    else {
        await db('academic_standards').where({ id: standardId }).update({
            name: SKILLONX_STANDARD_V1.name,
            is_active: true,
            updated_at: db.fn.now(),
        });
    }
    const versionRow = await db('academic_standard_versions')
        .where({ standard_id: standardId, version: SKILLONX_STANDARD_V1.version })
        .first();
    if (!versionRow) {
        await db('academic_standard_versions').where({ standard_id: standardId }).update({ is_current: false });
        await db('academic_standard_versions').insert({
            standard_id: standardId,
            version: SKILLONX_STANDARD_V1.version,
            status: 'ACTIVE',
            is_current: true,
            policy_json: JSON.stringify(SKILLONX_STANDARD_V1),
            formula_version: FORMULA_VERSION,
            published_at: db.fn.now(),
        });
    }
    for (const cause of ROOT_CAUSES) {
        const row = await db('attainment_root_causes').where({ code: cause.code }).first();
        const payload = {
            category: cause.category,
            label: cause.label,
            description: cause.description,
            library_version: '1.0',
            is_active: true,
        };
        if (row)
            await db('attainment_root_causes').where({ id: row.id }).update({ ...payload, updated_at: db.fn.now() });
        else
            await db('attainment_root_causes').insert({ code: cause.code, ...payload });
    }
    for (const action of ACTIONS) {
        const row = await db('attainment_corrective_actions').where({ code: action.code }).first();
        const payload = {
            label: action.label,
            category: action.category,
            description: action.description,
            evidence_profile: action.evidenceProfile,
            library_version: '1.0',
            is_active: true,
        };
        if (row)
            await db('attainment_corrective_actions').where({ id: row.id }).update({ ...payload, updated_at: db.fn.now() });
        else
            await db('attainment_corrective_actions').insert({ code: action.code, ...payload });
    }
    const causes = await db('attainment_root_causes').select('id', 'code');
    const actions = await db('attainment_corrective_actions').select('id', 'code');
    const causeId = new Map(causes.map((c) => [String(c.code), Number(c.id)]));
    const actionId = new Map(actions.map((a) => [String(a.code), Number(a.id)]));
    for (const link of CAUSE_ACTION_LINKS) {
        const cid = causeId.get(link.cause);
        if (!cid)
            continue;
        for (const code of link.actions) {
            const aid = actionId.get(code);
            if (!aid)
                continue;
            const exists = await db('attainment_cause_action_links').where({ cause_id: cid, action_id: aid }).first();
            if (!exists)
                await db('attainment_cause_action_links').insert({ cause_id: cid, action_id: aid });
        }
    }
    for (const tpl of EVIDENCE_TEMPLATES) {
        const exists = await db('attainment_evidence_templates')
            .where({ evidence_profile: tpl.actionProfile, code: tpl.code })
            .first();
        const payload = {
            label: tpl.label,
            required: tpl.required,
            auto_link_source: tpl.autoLinkSource ?? null,
            library_version: '1.0',
        };
        if (exists)
            await db('attainment_evidence_templates').where({ id: exists.id }).update(payload);
        else
            await db('attainment_evidence_templates').insert({ evidence_profile: tpl.actionProfile, code: tpl.code, ...payload });
    }
    for (const rec of PO_ACTIONS) {
        for (const actionCode of rec.actionCodes) {
            const exists = await db('attainment_po_action_recs').where({ po_code: rec.poCode, action_code: actionCode }).first();
            if (!exists) {
                await db('attainment_po_action_recs').insert({
                    po_code: rec.poCode,
                    label: rec.label,
                    action_code: actionCode,
                    library_version: '1.0',
                });
            }
        }
    }
}
