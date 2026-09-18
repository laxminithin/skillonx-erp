/** Payment gateway provider abstraction — do not hardcode Razorpay/Cashfree in controllers. */
import { db } from '../../db/index.js';
import { randomUUID } from 'node:crypto';
import { toMoney } from './money.js';
import { allocatePayment } from './payments.js';
import { generateReceipt } from './receipts.js';
import { notifyPaymentSuccess, notifyPaymentFailed } from './notifications.js';
import { getFinancePolicy } from './feeHeads.js';
import { nextDocumentNumber } from './feeHeads.js';
import { AppError } from '../../utils/errors.js';
/** Mock provider for development and E2E — simulates gateway behavior. */
class MockGatewayProvider {
    name = 'MOCK';
    async createOrder(params) {
        return {
            providerOrderId: `mock_order_${randomUUID().slice(0, 8)}`,
            checkoutData: { amount: params.amount, currency: params.currency, mock: true },
        };
    }
    async verifyPayment(params) {
        const success = params.paymentData?.status !== 'failed';
        return {
            verified: success,
            transactionReference: `mock_txn_${params.providerOrderId.slice(-8)}`,
            gatewayReference: params.providerOrderId,
        };
    }
}
const providers = {
    MOCK: new MockGatewayProvider(),
};
export function getGatewayProvider(name) {
    const providerName = name ?? 'MOCK';
    const provider = providers[providerName];
    if (!provider)
        throw new AppError(400, `Payment gateway provider "${providerName}" not configured`);
    return provider;
}
export function registerGatewayProvider(provider) {
    providers[provider.name] = provider;
}
export async function initiateOnlinePayment(studentId, collegeId, body) {
    const demands = await db('student_fee_demands')
        .where({ student_id: studentId, college_id: collegeId })
        .whereIn('id', body.demandIds)
        .whereIn('status', ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE']);
    if (!demands.length)
        throw new AppError(400, 'No payable demands found');
    let payableAmount = body.amount;
    if (!payableAmount) {
        payableAmount = demands.reduce((acc, d) => acc + Number(d.outstanding_amount), 0);
    }
    const policy = await getFinancePolicy(collegeId);
    const provider = getGatewayProvider(policy.defaultGatewayProvider);
    return db.transaction(async (trx) => {
        const paymentNumber = await nextDocumentNumber(trx, collegeId, policy.paymentSeries);
        const [paymentId] = await trx('student_payments').insert({
            college_id: collegeId,
            student_id: studentId,
            payment_number: paymentNumber,
            amount: toMoney(payableAmount),
            payment_date: new Date().toISOString().slice(0, 10),
            payment_method: 'ONLINE_GATEWAY',
            status: 'INITIATED',
            idempotency_key: `online:${studentId}:${Date.now()}`,
        });
        const order = await provider.createOrder({
            collegeId,
            studentId,
            amount: toMoney(payableAmount),
            currency: policy.currency,
            metadata: { demandIds: body.demandIds, paymentId },
        });
        await trx('payment_gateway_orders').insert({
            college_id: collegeId,
            student_id: studentId,
            payment_id: paymentId,
            provider: provider.name,
            order_id: order.providerOrderId,
            amount: toMoney(payableAmount),
            currency: policy.currency,
            status: 'CREATED',
            metadata: JSON.stringify({ demandIds: body.demandIds, installmentIds: body.installmentIds }),
        });
        return {
            paymentId: Number(paymentId),
            paymentNumber,
            orderId: order.providerOrderId,
            provider: provider.name,
            amount: toMoney(payableAmount),
            currency: policy.currency,
            checkoutData: order.checkoutData,
        };
    });
}
export async function verifyAndCompletePayment(provider, eventId, orderId, paymentData) {
    const existingEvent = await db('payment_gateway_webhook_events')
        .where({ provider, event_id: eventId })
        .first();
    if (existingEvent)
        return { duplicate: true, status: existingEvent.status };
    await db('payment_gateway_webhook_events').insert({
        provider,
        event_id: eventId,
        event_type: String(paymentData?.event ?? 'payment'),
        payload: JSON.stringify(paymentData),
        status: 'RECEIVED',
    });
    const gatewayOrder = await db('payment_gateway_orders')
        .where({ provider, order_id: orderId })
        .first();
    if (!gatewayOrder)
        throw new AppError(404, 'Gateway order not found');
    const gateway = getGatewayProvider(provider);
    const verification = await gateway.verifyPayment({ providerOrderId: orderId, paymentData });
    if (!verification.verified) {
        await db('student_payments').where({ id: gatewayOrder.payment_id }).update({
            status: 'FAILED',
            updated_at: db.fn.now(),
        });
        await db('payment_gateway_webhook_events')
            .where({ provider, event_id: eventId })
            .update({ status: 'PROCESSED', processed_at: db.fn.now() });
        await notifyPaymentFailed(Number(gatewayOrder.student_id), Number(gatewayOrder.college_id));
        return { success: false, status: 'FAILED' };
    }
    const result = await db.transaction(async (trx) => {
        await trx('student_payments').where({ id: gatewayOrder.payment_id }).update({
            status: 'SUCCESS',
            transaction_reference: verification.transactionReference ?? null,
            gateway_reference: verification.gatewayReference ?? orderId,
            updated_at: trx.fn.now(),
        });
        const metadata = gatewayOrder.metadata
            ? typeof gatewayOrder.metadata === 'string'
                ? JSON.parse(gatewayOrder.metadata)
                : gatewayOrder.metadata
            : {};
        const demandIds = metadata.demandIds;
        await allocatePayment(trx, {
            paymentId: Number(gatewayOrder.payment_id),
            collegeId: Number(gatewayOrder.college_id),
            studentId: Number(gatewayOrder.student_id),
            amount: Number(gatewayOrder.amount),
            demandIds,
        });
        const receipt = await generateReceipt(trx, {
            collegeId: Number(gatewayOrder.college_id),
            studentId: Number(gatewayOrder.student_id),
            paymentId: Number(gatewayOrder.payment_id),
        });
        await trx('payment_gateway_orders').where({ id: gatewayOrder.id }).update({
            status: 'COMPLETED',
            updated_at: trx.fn.now(),
        });
        return receipt;
    });
    await db('payment_gateway_webhook_events')
        .where({ provider, event_id: eventId })
        .update({ status: 'PROCESSED', processed_at: db.fn.now() });
    await notifyPaymentSuccess(Number(gatewayOrder.student_id), Number(gatewayOrder.college_id), String(gatewayOrder.amount), String(result.receiptNumber));
    return { success: true, receipt: result };
}
