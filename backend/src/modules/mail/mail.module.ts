import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => {
        const mailPort = Number(config.get('MAIL_PORT', 587));
        const secure = config.get('MAIL_SECURE') === 'true' || mailPort === 465;
        const fromName = config.get('MAIL_FROM_NAME', 'Xianze Support');
        const fromAddress = config.get('MAIL_FROM');
        const replyTo = config.get('MAIL_REPLY_TO') || fromAddress;
        const listUnsubscribe = config.get('MAIL_LIST_UNSUBSCRIBE');
        const listUnsubscribePost = config.get('MAIL_LIST_UNSUBSCRIBE_POST');

        const defaultHeaders: Record<string, string> = {
          'X-Entity-Ref-ID': 'xianze-2026',
        };

        if (listUnsubscribe) {
          defaultHeaders['List-Unsubscribe'] = listUnsubscribe;
        }

        if (listUnsubscribePost) {
          defaultHeaders['List-Unsubscribe-Post'] = listUnsubscribePost;
        }

        return {
          transport: {
            host: config.get('MAIL_HOST'),
            port: mailPort,
            secure,
            auth: {
              user: config.get('MAIL_USER'),
              pass: config.get('MAIL_PASSWORD'),
            },
            tls: {
              rejectUnauthorized: false,
            },
          },
          defaults: {
            from: `"${fromName}" <${fromAddress}>`,
            replyTo,
            headers: defaultHeaders,
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
