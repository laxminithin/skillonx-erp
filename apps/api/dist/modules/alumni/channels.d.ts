import type { ChannelCapability, ChannelType } from './typesEngagement.js';
export type ChannelDescriptor = {
    channel: ChannelType;
    capability: ChannelCapability;
    reason: string;
    supportsDeliveryTelemetry: boolean;
};
/**
 * Honest capability report.
 * EMAIL is MANUAL_ONLY even when SMTP_* is set, because mailer.ts only
 * writes an outbox / console — no controlled integration test / real SMTP client.
 * WhatsApp / SMS / telephony: UNAVAILABLE (no provider).
 * PHONE / IN_PERSON / MANUAL / PORTAL_NOTIFICATION: MANUAL_ONLY.
 */
export declare function getChannelCapability(channel: ChannelType): ChannelDescriptor;
export declare function listChannelCapabilities(): ChannelDescriptor[];
/** Future provider adapters plug in here without changing campaign business logic. */
export interface ChannelAdapter {
    channel: ChannelType;
    capability(): ChannelDescriptor;
    /** Prepare payload for human execution — never auto-sends unless CONFIGURED. */
    prepare(input: {
        toHint?: string | null;
        subject?: string | null;
        body: string;
    }): {
        mode: 'PREPARE_ONLY';
        preview: {
            subject?: string | null;
            body: string;
            toHint?: string | null;
        };
    };
}
export declare class ManualChannelAdapter implements ChannelAdapter {
    channel: ChannelType;
    constructor(channel: ChannelType);
    capability(): ChannelDescriptor;
    prepare(input: {
        toHint?: string | null;
        subject?: string | null;
        body: string;
    }): {
        mode: "PREPARE_ONLY";
        preview: {
            toHint?: string | null;
            subject?: string | null;
            body: string;
        };
    };
}
export declare function getAdapter(channel: ChannelType): ChannelAdapter;
