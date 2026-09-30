/**
 * Channel capability abstraction (C4.9).
 * Adapters exist for future providers — capability is never CONFIGURED
 * merely because an adapter class exists.
 */
import { env } from '../../config/env.js';
import type { ChannelCapability, ChannelType } from './typesEngagement.js';
import { CHANNEL_TYPES } from './typesEngagement.js';

export type ChannelDescriptor = {
  channel: ChannelType;
  capability: ChannelCapability;
  reason: string;
  supportsDeliveryTelemetry: boolean;
};

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
export function getChannelCapability(channel: ChannelType): ChannelDescriptor {
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

export function listChannelCapabilities(): ChannelDescriptor[] {
  return CHANNEL_TYPES.map(getChannelCapability);
}

/** Future provider adapters plug in here without changing campaign business logic. */
export interface ChannelAdapter {
  channel: ChannelType;
  capability(): ChannelDescriptor;
  /** Prepare payload for human execution — never auto-sends unless CONFIGURED. */
  prepare(input: { toHint?: string | null; subject?: string | null; body: string }): {
    mode: 'PREPARE_ONLY';
    preview: { subject?: string | null; body: string; toHint?: string | null };
  };
}

export class ManualChannelAdapter implements ChannelAdapter {
  constructor(public channel: ChannelType) {}
  capability() {
    return getChannelCapability(this.channel);
  }
  prepare(input: { toHint?: string | null; subject?: string | null; body: string }) {
    return { mode: 'PREPARE_ONLY' as const, preview: input };
  }
}

export function getAdapter(channel: ChannelType): ChannelAdapter {
  return new ManualChannelAdapter(channel);
}
