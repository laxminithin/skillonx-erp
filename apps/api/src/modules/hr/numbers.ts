import { nextDocumentNumber } from '../finance/feeHeads.js';

export async function nextEmployeeNumber(trx: import('knex').Knex.Transaction, collegeId: number) {
  return nextDocumentNumber(trx, collegeId, 'EMP');
}

export async function nextLeaveRequestNumber(trx: import('knex').Knex.Transaction, collegeId: number) {
  return nextDocumentNumber(trx, collegeId, 'HR/LV');
}

export async function nextPayrollRunNumber(trx: import('knex').Knex.Transaction, collegeId: number) {
  return nextDocumentNumber(trx, collegeId, 'HR/PAY');
}

export async function nextPayslipNumber(trx: import('knex').Knex.Transaction, collegeId: number) {
  return nextDocumentNumber(trx, collegeId, 'HR/PSL');
}

export async function nextHrRequestNumber(trx: import('knex').Knex.Transaction, collegeId: number) {
  return nextDocumentNumber(trx, collegeId, 'HR/REQ');
}

export async function nextFnfCaseNumber(trx: import('knex').Knex.Transaction, collegeId: number) {
  return nextDocumentNumber(trx, collegeId, 'HR/FNF');
}
