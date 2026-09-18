import type { Knex } from 'knex';
export declare function nextTransportApplicationNumber(trx: Knex.Transaction, collegeId: number): Promise<string>;
export declare function nextTransportMemberNumber(trx: Knex.Transaction, collegeId: number): Promise<string>;
export declare function nextTransportPassNumber(trx: Knex.Transaction, collegeId: number): Promise<string>;
export declare function generatePassVerificationToken(): string;
