import { Injectable, Logger } from '@nestjs/common';

export interface ProviderSendResult {
  success: boolean;
  providerMessageId?: string;
  errorMessage?: string;
}

/**
 * Provider abstraction layer.
 * Each channel has a stub implementation. When a real provider
 * (SendGrid, Twilio, WATI, FCM) is wired in, only the relevant
 * method needs updating — nothing else changes.
 */
@Injectable()
export class NotificationProviderService {
  private readonly logger = new Logger(NotificationProviderService.name);

  async send(
    channel: string,
    recipient: string,
    title: string,
    body: string,
    providerName: string,
  ): Promise<ProviderSendResult> {
    switch (channel) {
      case 'IN_APP':
        return this.sendInApp(recipient, title, body);
      case 'EMAIL':
        return this.sendEmail(recipient, title, body, providerName);
      case 'SMS':
        return this.sendSms(recipient, body, providerName);
      case 'WHATSAPP':
        return this.sendWhatsApp(recipient, body, providerName);
      case 'PUSH':
        return this.sendPush(recipient, title, body, providerName);
      default:
        return { success: false, errorMessage: `Unknown channel: ${channel}` };
    }
  }

  // ─── In-App ───────────────────────────────────────────────────
  // IN_APP is stored directly in the notifications table — no external call needed.
  private async sendInApp(
    _recipient: string,
    _title: string,
    _body: string,
  ): Promise<ProviderSendResult> {
    return { success: true, providerMessageId: 'in-app' };
  }

  // ─── Email ────────────────────────────────────────────────────
  // TODO: wire to SendGrid / AWS SES / SMTP
  private async sendEmail(
    recipient: string,
    subject: string,
    body: string,
    provider: string,
  ): Promise<ProviderSendResult> {
    this.logger.debug(`[EMAIL/${provider}] → ${recipient} | "${subject}"`);
    // Stub: always succeeds in development
    return {
      success: true,
      providerMessageId: `email-stub-${Date.now()}`,
    };
  }

  // ─── SMS ─────────────────────────────────────────────────────
  // TODO: wire to Twilio / MSG91 / Exotel
  private async sendSms(
    recipient: string,
    body: string,
    provider: string,
  ): Promise<ProviderSendResult> {
    this.logger.debug(`[SMS/${provider}] → ${recipient} | "${body.slice(0, 40)}…"`);
    return {
      success: true,
      providerMessageId: `sms-stub-${Date.now()}`,
    };
  }

  // ─── WhatsApp ─────────────────────────────────────────────────
  // TODO: wire to WATI / Meta Cloud API
  private async sendWhatsApp(
    recipient: string,
    body: string,
    provider: string,
  ): Promise<ProviderSendResult> {
    this.logger.debug(`[WHATSAPP/${provider}] → ${recipient} | "${body.slice(0, 40)}…"`);
    return {
      success: true,
      providerMessageId: `wa-stub-${Date.now()}`,
    };
  }

  // ─── Push ─────────────────────────────────────────────────────
  // TODO: wire to Firebase FCM / APNs
  private async sendPush(
    recipient: string,
    title: string,
    body: string,
    provider: string,
  ): Promise<ProviderSendResult> {
    this.logger.debug(`[PUSH/${provider}] → ${recipient} | "${title}"`);
    return {
      success: true,
      providerMessageId: `push-stub-${Date.now()}`,
    };
  }
}
