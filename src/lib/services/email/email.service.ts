import { EmailDeliveryError } from "../../errors";

export interface EmailPayload {
  to: string;
  subject: string;
  token: string;
  link: string;
  html: string;
  text: string;
  dispatchedAt: Date;
}

export interface EmailDeliveryResult {
  success: boolean;
  provider: "local" | "resend";
  messageId?: string;
  error?: string;
}

export interface IEmailProvider {
  getProviderName(): string;
  sendVerificationEmail(
    email: string,
    token: string,
    displayName?: string | null
  ): Promise<EmailDeliveryResult>;
  sendPasswordResetEmail(
    email: string,
    token: string,
    displayName?: string | null
  ): Promise<EmailDeliveryResult>;
}

// In-memory test mailbox for isolated unit/integration testing without external networks
const testInbox: Map<string, EmailPayload[]> = new Map();

export function getLatestEmailForTesting(email: string): EmailPayload | null {
  const messages = testInbox.get(email.toLowerCase());
  return messages && messages.length > 0 ? messages[messages.length - 1] : null;
}

export function getAllEmailsForTesting(email?: string): EmailPayload[] {
  if (email) {
    return testInbox.get(email.toLowerCase()) || [];
  }
  const all: EmailPayload[] = [];
  for (const list of testInbox.values()) {
    all.push(...list);
  }
  return all;
}

export function clearTestInbox(): void {
  testInbox.clear();
}

/**
 * Build elegant editorial HTML & plain text for email verification.
 */
function buildVerificationEmailContent(
  email: string,
  token: string,
  displayName?: string | null,
  appUrl = "http://localhost:3000"
) {
  const link = `${appUrl}/auth/verify?token=${encodeURIComponent(token)}`;
  const authorName = displayName ? displayName.trim() : "Author";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Verify your INKFORGE author account</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #f6f1e6; font-family: Charter, Georgia, 'Times New Roman', serif; color: #171513;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4dccb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(23, 21, 19, 0.05);">
    <!-- Publisher Masthead -->
    <tr>
      <td style="padding: 28px 32px 20px; border-bottom: 1px solid #ded5c3; text-align: center; background-color: #fbf9f4;">
        <span style="font-family: ui-monospace, Monaco, monospace; font-size: 11px; letter-spacing: 0.35em; text-transform: uppercase; color: #831e26; font-weight: bold;">
          I N K F O R G E
        </span>
        <h1 style="margin: 8px 0 0; font-size: 22px; font-weight: bold; color: #171513; letter-spacing: -0.01em;">
          Confirm Your Author Imprint
        </h1>
      </td>
    </tr>
    <!-- Letter Body -->
    <tr>
      <td style="padding: 32px; font-size: 15px; line-height: 1.75; color: #423e38;">
        <p style="margin-top: 0;">Greetings ${authorName},</p>
        <p>
          Welcome to <strong>INKFORGE</strong>, an independent digital publishing sanctuary built for enduring words.
          To confirm your email address and activate your author credentials, please verify your account:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${link}" style="display: inline-block; background-color: #831e26; color: #ffffff; text-decoration: none; padding: 13px 30px; font-family: ui-monospace, Monaco, monospace; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; font-weight: bold; border-radius: 4px; box-shadow: 0 2px 4px rgba(131, 30, 38, 0.2);">
            Verify Author Account
          </a>
        </div>
        <p style="font-size: 13px; color: #6b665c; line-height: 1.6;">
          If the button above does not work in your mail client, copy and paste this link into your browser:
          <br>
          <a href="${link}" style="color: #831e26; word-break: break-all; font-family: ui-monospace, Monaco, monospace; font-size: 11px;">${link}</a>
        </p>
        <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #ded5c3; font-family: ui-monospace, Monaco, monospace; font-size: 11px; color: #6b665c; line-height: 1.6;">
          • This single-use verification link expires in 24 hours.<br>
          • If you did not create an INKFORGE account, you may safely ignore this email.
        </div>
      </td>
    </tr>
    <!-- Colophon Footer -->
    <tr>
      <td style="padding: 16px 32px; background-color: #fbf9f4; border-top: 1px solid #ded5c3; text-align: center; font-family: ui-monospace, Monaco, monospace; font-size: 10px; letter-spacing: 0.1em; color: #8e8a80; text-transform: uppercase;">
        INKFORGE Publishing Press • Continuous Archival Edition
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `INKFORGE — CONFIRM YOUR AUTHOR IMPRINT
==================================================

Greetings ${authorName},

Welcome to INKFORGE. To confirm your email address and activate your author account, please visit:

${link}

This single-use link expires in 24 hours.
If you did not create an account, you may safely disregard this message.

— The Editors of INKFORGE`;

  return { subject: "Verify your INKFORGE author account", link, html, text };
}

/**
 * Build elegant editorial HTML & plain text for password reset.
 */
function buildPasswordResetEmailContent(
  email: string,
  token: string,
  displayName?: string | null,
  appUrl = "http://localhost:3000"
) {
  const link = `${appUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;
  const authorName = displayName ? displayName.trim() : "Author";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Reset your INKFORGE password</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #f6f1e6; font-family: Charter, Georgia, 'Times New Roman', serif; color: #171513;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4dccb; border-radius: 8px; overflow: hidden;">
    <tr>
      <td style="padding: 28px 32px 20px; border-bottom: 1px solid #ded5c3; text-align: center; background-color: #fbf9f4;">
        <span style="font-family: ui-monospace, Monaco, monospace; font-size: 11px; letter-spacing: 0.35em; text-transform: uppercase; color: #831e26; font-weight: bold;">
          I N K F O R G E
        </span>
        <h1 style="margin: 8px 0 0; font-size: 22px; font-weight: bold; color: #171513;">
          Account Security &amp; Password Reset
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px; font-size: 15px; line-height: 1.75; color: #423e38;">
        <p style="margin-top: 0;">Greetings ${authorName},</p>
        <p>
          A password reset was requested for your INKFORGE author account. Click below to establish new credentials:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${link}" style="display: inline-block; background-color: #831e26; color: #ffffff; text-decoration: none; padding: 13px 30px; font-family: ui-monospace, Monaco, monospace; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; font-weight: bold; border-radius: 4px;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 13px; color: #6b665c;">
          Direct link: <a href="${link}" style="color: #831e26; word-break: break-all; font-family: ui-monospace, Monaco, monospace; font-size: 11px;">${link}</a>
        </p>
        <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #ded5c3; font-family: ui-monospace, Monaco, monospace; font-size: 11px; color: #6b665c;">
          • This single-use link expires in 1 hour.<br>
          • If you did not request this reset, your account remains secure and no action is required.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `INKFORGE — PASSWORD RESET
==================================================

Greetings ${authorName},

A password reset was requested for your account. Please visit:

${link}

This single-use link expires in 1 hour.
If you did not request this, you may safely ignore this message.

— The Editors of INKFORGE`;

  return { subject: "Reset your INKFORGE password", link, html, text };
}

/**
 * Local / Development Email Provider
 * Logs prominent notice to server console and records payload to in-memory test inbox.
 */
export class LocalDevelopmentEmailProvider implements IEmailProvider {
  getProviderName(): string {
    return "local";
  }

  async sendVerificationEmail(
    email: string,
    token: string,
    displayName?: string | null
  ): Promise<EmailDeliveryResult> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const { subject, link, html, text } = buildVerificationEmailContent(
      email,
      token,
      displayName,
      appUrl
    );

    const payload: EmailPayload = {
      to: email,
      subject,
      token,
      link,
      html,
      text,
      dispatchedAt: new Date(),
    };

    const existing = testInbox.get(email.toLowerCase()) || [];
    existing.push(payload);
    testInbox.set(email.toLowerCase(), existing);

    const maskedToken =
      token.length > 16 ? `${token.slice(0, 8)}...${token.slice(-6)}` : "***";

    if (process.env.NODE_ENV !== "test") {
      console.log(
        `\n┌────────────────────────────────────────────────────────────────────────┐\n` +
        `│ ✉️  [EMAIL ADAPTER: LOCAL/DEV] Verification Email Captured             │\n` +
        `├────────────────────────────────────────────────────────────────────────┤\n` +
        `│ To:      ${email.padEnd(61)} │\n` +
        `│ Link:    ${link.padEnd(61)} │\n` +
        `│ Token:   ${maskedToken.padEnd(61)} │\n` +
        `│ Mode:    Local Development (Simulated Inbox)                           │\n` +
        `│ Notice:  Set RESEND_API_KEY in .env to deliver real emails to inboxes  │\n` +
        `└────────────────────────────────────────────────────────────────────────┘\n`
      );
    }

    if (process.env.NODE_ENV === "production" && !process.env.RESEND_API_KEY) {
      console.warn(
        `⚠️  [EMAIL ADAPTER: PRODUCTION WARNING] Real email provider is not configured! ` +
        `Verification email to "${email}" was captured in-memory and will NOT reach the recipient.`
      );
    }

    return {
      success: true,
      provider: "local",
      messageId: `local-verify-${Date.now()}`,
    };
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
    displayName?: string | null
  ): Promise<EmailDeliveryResult> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const { subject, link, html, text } = buildPasswordResetEmailContent(
      email,
      token,
      displayName,
      appUrl
    );

    const payload: EmailPayload = {
      to: email,
      subject,
      token,
      link,
      html,
      text,
      dispatchedAt: new Date(),
    };

    const existing = testInbox.get(email.toLowerCase()) || [];
    existing.push(payload);
    testInbox.set(email.toLowerCase(), existing);

    const maskedToken =
      token.length > 16 ? `${token.slice(0, 8)}...${token.slice(-6)}` : "***";

    if (process.env.NODE_ENV !== "test") {
      console.log(
        `\n┌────────────────────────────────────────────────────────────────────────┐\n` +
        `│ ✉️  [EMAIL ADAPTER: LOCAL/DEV] Password Reset Email Captured           │\n` +
        `├────────────────────────────────────────────────────────────────────────┤\n` +
        `│ To:      ${email.padEnd(61)} │\n` +
        `│ Link:    ${link.padEnd(61)} │\n` +
        `│ Token:   ${maskedToken.padEnd(61)} │\n` +
        `│ Mode:    Local Development (Simulated Inbox)                           │\n` +
        `│ Notice:  Set RESEND_API_KEY in .env to deliver real emails to inboxes  │\n` +
        `└────────────────────────────────────────────────────────────────────────┘\n`
      );
    }

    return {
      success: true,
      provider: "local",
      messageId: `local-reset-${Date.now()}`,
    };
  }
}

/**
 * Resend Email Delivery Provider (HTTP REST API)
 * Directly delivers emails to real inboxes over HTTPS using Resend API.
 */
export class ResendEmailProvider implements IEmailProvider {
  private readonly apiKey: string;
  private readonly fromAddress: string;

  constructor(apiKey: string, fromAddress?: string) {
    this.apiKey = apiKey.trim();
    this.fromAddress = fromAddress?.trim() || "INKFORGE <onboarding@resend.dev>";
  }

  getProviderName(): string {
    return "resend";
  }

  async sendVerificationEmail(
    email: string,
    token: string,
    displayName?: string | null
  ): Promise<EmailDeliveryResult> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const { subject, link, html, text } = buildVerificationEmailContent(
      email,
      token,
      displayName,
      appUrl
    );

    const payload: EmailPayload = {
      to: email,
      subject,
      token,
      link,
      html,
      text,
      dispatchedAt: new Date(),
    };
    const existing = testInbox.get(email.toLowerCase()) || [];
    existing.push(payload);
    testInbox.set(email.toLowerCase(), existing);

    try {
      return await this.sendWithResend({
        to: email,
        subject,
        html,
        text,
      });
    } catch (err: unknown) {
      if (process.env.NODE_ENV !== "production") {
        const maskedToken =
          token.length > 16 ? `${token.slice(0, 8)}...${token.slice(-6)}` : "***";
        const errorMsg = err instanceof Error ? err.message : "Delivery failure";
        console.warn(
          `\n┌────────────────────────────────────────────────────────────────────────┐\n` +
          `│ ⚠️  [RESEND DISPATCH FAILED — LOCAL/DEV FALLBACK CAPTURED]              │\n` +
          `├────────────────────────────────────────────────────────────────────────┤\n` +
          `│ To:      ${email.padEnd(61)} │\n` +
          `│ Link:    ${link.padEnd(61)} │\n` +
          `│ Token:   ${maskedToken.padEnd(61)} │\n` +
          `│ Reason:  ${errorMsg.slice(0, 61).padEnd(61)} │\n` +
          `│ Notice:  Direct link printed for local testing and recovery             │\n` +
          `└────────────────────────────────────────────────────────────────────────┘\n`
        );
        return {
          success: true,
          provider: "local",
          messageId: `dev-fallback-${Date.now()}`,
        };
      }
      throw err;
    }
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
    displayName?: string | null
  ): Promise<EmailDeliveryResult> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const { subject, link, html, text } = buildPasswordResetEmailContent(
      email,
      token,
      displayName,
      appUrl
    );

    const payload: EmailPayload = {
      to: email,
      subject,
      token,
      link,
      html,
      text,
      dispatchedAt: new Date(),
    };
    const existing = testInbox.get(email.toLowerCase()) || [];
    existing.push(payload);
    testInbox.set(email.toLowerCase(), existing);

    try {
      return await this.sendWithResend({
        to: email,
        subject,
        html,
        text,
      });
    } catch (err: unknown) {
      if (process.env.NODE_ENV !== "production") {
        const maskedToken =
          token.length > 16 ? `${token.slice(0, 8)}...${token.slice(-6)}` : "***";
        const errorMsg = err instanceof Error ? err.message : "Delivery failure";
        console.warn(
          `\n┌────────────────────────────────────────────────────────────────────────┐\n` +
          `│ ⚠️  [RESEND DISPATCH FAILED — LOCAL/DEV FALLBACK CAPTURED]              │\n` +
          `├────────────────────────────────────────────────────────────────────────┤\n` +
          `│ To:      ${email.padEnd(61)} │\n` +
          `│ Link:    ${link.padEnd(61)} │\n` +
          `│ Token:   ${maskedToken.padEnd(61)} │\n` +
          `│ Reason:  ${errorMsg.slice(0, 61).padEnd(61)} │\n` +
          `│ Notice:  Direct link printed for local testing and recovery             │\n` +
          `└────────────────────────────────────────────────────────────────────────┘\n`
        );
        return {
          success: true,
          provider: "local",
          messageId: `dev-fallback-${Date.now()}`,
        };
      }
      throw err;
    }
  }

  private async sendWithResend(options: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<EmailDeliveryResult> {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.fromAddress,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = data?.message || `Resend API returned HTTP ${response.status}: ${response.statusText}`;
        console.error(`❌ [RESEND ERROR] Failed to send email to ${options.to}:`, errorMsg);
        throw new EmailDeliveryError(`Email delivery failed: ${errorMsg}`, {
          status: response.status,
          resendError: data,
        });
      }

      console.log(`✓ [RESEND SUCCESS] Email dispatched to ${options.to} (ID: ${data?.id})`);

      return {
        success: true,
        provider: "resend",
        messageId: data?.id,
      };
    } catch (err: unknown) {
      if (err instanceof EmailDeliveryError) {
        throw err;
      }
      const errorMsg = err instanceof Error ? err.message : "Network error contacting Resend API";
      console.error(`❌ [RESEND NETWORK ERROR]`, errorMsg);
      throw new EmailDeliveryError(`Email delivery network error: ${errorMsg}`);
    }
  }
}

/**
 * Service Manager with pluggable provider support.
 */
class EmailServiceManager implements IEmailProvider {
  private activeProvider: IEmailProvider;

  constructor() {
    this.activeProvider = this.createDefaultProvider();
  }

  private createDefaultProvider(): IEmailProvider {
    if (
      process.env.NODE_ENV !== "test" &&
      process.env.RESEND_API_KEY &&
      process.env.RESEND_API_KEY.trim() !== ""
    ) {
      return new ResendEmailProvider(
        process.env.RESEND_API_KEY,
        process.env.EMAIL_FROM
      );
    }
    return new LocalDevelopmentEmailProvider();
  }

  getProviderName(): string {
    return this.activeProvider.getProviderName();
  }

  setProvider(provider: IEmailProvider): void {
    this.activeProvider = provider;
  }

  resetToDefault(): void {
    this.activeProvider = this.createDefaultProvider();
  }

  async sendVerificationEmail(
    email: string,
    token: string,
    displayName?: string | null
  ): Promise<EmailDeliveryResult> {
    return this.activeProvider.sendVerificationEmail(email, token, displayName);
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
    displayName?: string | null
  ): Promise<EmailDeliveryResult> {
    return this.activeProvider.sendPasswordResetEmail(email, token, displayName);
  }
}

export const emailService = new EmailServiceManager();
