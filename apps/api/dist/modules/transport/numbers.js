import { nextDocumentNumber } from '../finance/feeHeads.js';
import { nanoid } from 'nanoid';
export async function nextTransportApplicationNumber(trx, collegeId) {
    return nextDocumentNumber(trx, collegeId, 'TRN');
}
export async function nextTransportMemberNumber(trx, collegeId) {
    return nextDocumentNumber(trx, collegeId, 'TRN-MEM');
}
export async function nextTransportPassNumber(trx, collegeId) {
    return nextDocumentNumber(trx, collegeId, 'TPASS');
}
export function generatePassVerificationToken() {
    return nanoid(32);
}
