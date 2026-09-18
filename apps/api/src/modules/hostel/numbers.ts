import { nextDocumentNumber } from '../finance/feeHeads.js';
import type { Knex } from 'knex';
import { nanoid } from 'nanoid';

export async function nextHostelApplicationNumber(trx: Knex.Transaction, collegeId: number) {
  return nextDocumentNumber(trx, collegeId, 'HST');
}

export async function nextResidentNumber(trx: Knex.Transaction, collegeId: number) {
  return nextDocumentNumber(trx, collegeId, 'HST-RES');
}

export async function nextOutpassNumber(trx: Knex.Transaction, collegeId: number) {
  return nextDocumentNumber(trx, collegeId, 'HOP');
}

export function generateOutpassToken(): string {
  return nanoid(24);
}
