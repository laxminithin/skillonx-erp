import type { Knex } from 'knex';
export type CopoAuditInput = {
    collegeId: number;
    actorId?: number | null;
    actorName?: string | null;
    action: string;
    mappingVersionId?: number | null;
    mappingKind?: string | null;
    courseId?: number | null;
    courseOutcomeId?: number | null;
    programOutcomeId?: number | null;
    programSpecificOutcomeId?: number | null;
    sdgId?: number | null;
    academicYearId?: number | null;
    previousValue?: string | null;
    newValue?: string | null;
    metadata?: Record<string, unknown> | null;
};
export declare function writeCopoAudit(input: CopoAuditInput, trx?: Knex | Knex.Transaction): Promise<void>;
