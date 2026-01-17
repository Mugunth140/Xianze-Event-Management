import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendUserConfirmation(email: string, name: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to Xianze 2026',
      template: './confirmation', // .hbs extension is appended automatically
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
}
