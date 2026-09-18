import { nextDocumentNumber } from '../finance/feeHeads.js';
import type { Knex } from 'knex';
import { nanoid } from 'nanoid';

export async function nextTransportApplicationNumber(trx: Knex.Transaction, collegeId: number) {
  return nextDocumentNumber(trx, collegeId, 'TRN');
}

export async function nextTransportMemberNumber(trx: Knex.Transaction, collegeId: number) {
  return nextDocumentNumber(trx, collegeId, 'TRN-MEM');
}

export async function nextTransportPassNumber(trx: Knex.Transaction, collegeId: number) {
  return nextDocumentNumber(trx, collegeId, 'TPASS');
}

export function generatePassVerificationToken(): string {
  return nanoid(32);
}
