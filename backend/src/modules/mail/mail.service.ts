import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';

export interface RegistrationEmailData {
  name: string;
  email: string;
  event: string;
  transactionId: string;
  college: string;
}

export interface CashRegistrationEmailData {
  name: string;
  email: string;
  event: string;
  college: string;
}

export interface EventPassEmailData {
  name: string;
  email: string;
  event: string;
  passId: string;
  qrCodeHash: string;
  college: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private mailerService: MailerService) {}

  /**
   * Send registration confirmation email (payment processing)
   */
  async sendRegistrationConfirmation(data: RegistrationEmailData): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: '🎉 Registration Received - XIANZE 2026',
        template: './registration-confirmation',
        context: {
          name: data.name,
          event: data.event,
          transactionId: data.transactionId,
          college: data.college,
          year: new Date().getFullYear(),
        },
      });
      this.logger.log(`Registration confirmation email sent to ${data.email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send registration confirmation to ${data.email}`, error);
      return false;
    }
  }

  /**
   * Send cash payment registration confirmation email
   */
  async sendCashRegistrationConfirmation(data: CashRegistrationEmailData): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: '🎉 Cash Registration Received - XIANZE 2026',
        template: './registration-confirmation-cash',
        context: {
          name: data.name,
          event: data.event,
          college: data.college,
          year: new Date().getFullYear(),
        },
      });
      this.logger.log(`Cash registration confirmation email sent to ${data.email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send cash registration confirmation to ${data.email}`, error);
      return false;
    }
  }

  /**
   * Send event pass email with QR code (after payment verification)
   */
  async sendEventPass(data: EventPassEmailData): Promise<boolean> {
    try {
      // Generate QR code as buffer for attachment
      const qrCodeBuffer = await QRCode.toBuffer(data.qrCodeHash, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1a1a1a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });

      await this.mailerService.sendMail({
        to: data.email,
        subject: "🎟️ Your Event Pass - Xianze'26",
        template: './event-pass',
        context: {
          name: data.name,
          event: data.event,
          passId: data.passId,
          college: data.college,
          year: new Date().getFullYear(),
        },
        attachments: [
          {
            filename: 'qrcode.png',
            content: qrCodeBuffer,
            cid: 'qrcode', // Referenced in template as src="cid:qrcode"
          },
        ],
      });
      this.logger.log(`Event pass email sent to ${data.email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send event pass to ${data.email}`, error);
      return false;
    }
  }

  /**
   * Send payment rejection email
   */
  async sendPaymentRejection(
    email: string,
    name: string,
    event: string,
    reason: string,
  ): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: '⚠️ Payment Verification Update - XIANZE 2026',
        template: './payment-rejection',
        context: {
          name,
          event,
          reason,
          year: new Date().getFullYear(),
        },
      });
      this.logger.log(`Payment rejection email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send payment rejection to ${email}`, error);
      return false;
    }
  }

  async sendUserConfirmation(email: string, name: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to Xianze 2026',
      template: './confirmation',
      context: {
        name,
      },
    });
  }

  async sendContactAutoReply(email: string, name: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'We received your message - Xianze 2026',
      template: './contact-reply',
      context: {
        name,
      },
    });
  }

  /**
   * Send reply to contact inquiry from contact@xianze.tech
   */
  async sendContactReply(
    email: string,
    name: string,
    originalMessage: string,
    replyMessage: string,
  ): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: email,
        from: '"XIANZE Team" <contact@xianze.tech>',
        subject: 'Re: Your inquiry - XIANZE 2026',
        template: './contact-coordinator-reply',
        context: {
          name,
          originalMessage,
          replyMessage,
          year: new Date().getFullYear(),
        },
      });
      this.logger.log(`Coordinator reply sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send coordinator reply to ${email}`, error);
      throw error;
    }
  }

  /**
   * Send certificate email with PDF attachments
   */
  async sendCertificateEmail(
    email: string,
    name: string,
    attachments: Array<{ filename: string; path: string }>,
  ): Promise<boolean> {
    try {
      const plural = attachments.length > 1;
      await this.mailerService.sendMail({
        to: email,
        subject: "🎓 Your E-Certificate - Xianze'26",
        template: './certificate-delivery',
        context: {
          name,
          plural,
          certificateCount: attachments.length,
          year: new Date().getFullYear(),
        },
        attachments: attachments.map((a) => ({
          filename: a.filename,
          path: a.path,
          contentType: 'application/pdf',
        })),
      });
      this.logger.log(
        `Certificate email sent to ${email} with ${attachments.length} attachment(s)`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to send certificate email to ${email}`, error);
      return false;
    }
  }

  /**
   * Send certificate email from contact@xianze.tech with buffer attachments
   */
  async sendCertificateEmailFromContact(
    email: string,
    name: string,
    attachments: Array<{ filename: string; content: Buffer }>,
  ): Promise<boolean> {
    try {
      const plural = attachments.length > 1;
      await this.mailerService.sendMail({
        to: email,
        from: '"XIANZE Team" <contact@xianze.tech>',
        subject: "\uD83C\uDF93 Your E-Certificate - Xianze'26",
        template: './certificate-delivery',
        context: {
          name,
          plural,
          certificateCount: attachments.length,
          year: new Date().getFullYear(),
        },
        attachments: attachments.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: 'application/pdf',
        })),
      });
      this.logger.log(
        `Certificate email (from contact@) sent to ${email} with ${attachments.length} attachment(s)`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to send certificate email (from contact@) to ${email}`, error);
      return false;
    }
  }
}
