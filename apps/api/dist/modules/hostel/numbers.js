import { nextDocumentNumber } from '../finance/feeHeads.js';
import { nanoid } from 'nanoid';
export async function nextHostelApplicationNumber(trx, collegeId) {
    return nextDocumentNumber(trx, collegeId, 'HST');
}
export async function nextResidentNumber(trx, collegeId) {
    return nextDocumentNumber(trx, collegeId, 'HST-RES');
}
export async function nextOutpassNumber(trx, collegeId) {
    return nextDocumentNumber(trx, collegeId, 'HOP');
}
export function generateOutpassToken() {
    return nanoid(24);
}
