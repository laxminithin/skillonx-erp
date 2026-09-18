import { nextDocumentNumber } from '../finance/feeHeads.js';
export async function nextEmployeeNumber(trx, collegeId) {
    return nextDocumentNumber(trx, collegeId, 'EMP');
}
export async function nextLeaveRequestNumber(trx, collegeId) {
    return nextDocumentNumber(trx, collegeId, 'HR/LV');
}
export async function nextPayrollRunNumber(trx, collegeId) {
    return nextDocumentNumber(trx, collegeId, 'HR/PAY');
}
export async function nextPayslipNumber(trx, collegeId) {
    return nextDocumentNumber(trx, collegeId, 'HR/PSL');
}
export async function nextHrRequestNumber(trx, collegeId) {
    return nextDocumentNumber(trx, collegeId, 'HR/REQ');
}
export async function nextFnfCaseNumber(trx, collegeId) {
    return nextDocumentNumber(trx, collegeId, 'HR/FNF');
}
