/**
 * Channel capability abstraction (C4.9).
 * Adapters exist for future providers — capability is never CONFIGURED
 * merely because an adapter class exists.
 */
import { env } from '../../config/env.js';
import { CHANNEL_TYPES } from './typesEngagement.js';
function smtpConfigured() {
    return Boolean(env.SMTP_HOST && env.SMTP_FROM);
}
/**
 * Honest capability report.
 * EMAIL is MANUAL_ONLY even when SMTP_* is set, because mailer.ts only
 * writes an outbox / console — no controlled integration test / real SMTP client.
 * WhatsApp / SMS / telephony: UNAVAILABLE (no provider).
 * PHONE / IN_PERSON / MANUAL / PORTAL_NOTIFICATION: MANUAL_ONLY.
 */
export function getChannelCapability(channel) {
    switch (channel) {
        case 'EMAIL':
            return {
                channel,
                capability: 'MANUAL_ONLY',
                reason: smtpConfigured()
                    ? 'SMTP env present but no verified email provider integration — use manual / outbox prepare-only.'
                    : 'No email provider configured. Prepare, schedule, and log manually.',
                supportsDeliveryTelemetry: false,
            };
        case 'WHATSAPP':
            return {
                channel,
                capability: 'UNAVAILABLE',
                reason: 'No WhatsApp Business / provider integration.',
                supportsDeliveryTelemetry: false,
            };
        case 'SMS':
            return {
                channel,
                capability: 'UNAVAILABLE',
                reason: 'No SMS provider integration.',
                supportsDeliveryTelemetry: false,
            };
        case 'PHONE':
            return {
                channel,
                capability: 'MANUAL_ONLY',
                reason: 'Phone outreach is a first-class manual workflow.',
                supportsDeliveryTelemetry: false,
            };
        case 'IN_PERSON':
            return {
                channel,
                capability: 'MANUAL_ONLY',
                reason: 'In-person engagement is logged manually.',
                supportsDeliveryTelemetry: false,
            };
        case 'PORTAL_NOTIFICATION':
            return {
                channel,
                capability: 'MANUAL_ONLY',
                reason: 'No alumni push notification table; portal notices are pull-model only.',
                supportsDeliveryTelemetry: false,
            };
        case 'MANUAL':
            return {
                channel,
                capability: 'MANUAL_ONLY',
                reason: 'Manual execution queue is the supported outreach mode.',
                supportsDeliveryTelemetry: false,
            };
        case 'OTHER':
            return {
                channel,
                capability: 'MANUAL_ONLY',
                reason: 'Unspecified channel — treat as manual logging.',
                supportsDeliveryTelemetry: false,
            };
        default:
            return {
                channel,
                capability: 'UNAVAILABLE',
                reason: 'Unknown channel.',
                supportsDeliveryTelemetry: false,
            };
    }
}
export function listChannelCapabilities() {
    return CHANNEL_TYPES.map(getChannelCapability);
}
export class ManualChannelAdapter {
    channel;
    constructor(channel) {
        this.channel = channel;
    }
    capability() {
        return getChannelCapability(this.channel);
    }
    prepare(input) {
        return { mode: 'PREPARE_ONLY', preview: input };
    }
}
export function getAdapter(channel) {
    return new ManualChannelAdapter(channel);
}
