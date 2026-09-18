import type { Knex } from 'knex';
export declare function nextHostelApplicationNumber(trx: Knex.Transaction, collegeId: number): Promise<string>;
export declare function nextResidentNumber(trx: Knex.Transaction, collegeId: number): Promise<string>;
export declare function nextOutpassNumber(trx: Knex.Transaction, collegeId: number): Promise<string>;
export declare function generateOutpassToken(): string;
