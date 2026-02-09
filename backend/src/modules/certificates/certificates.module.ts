import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module';
import { Registration } from '../registration/registration.entity';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';
import { CertificateComplaint } from './entities/certificate-complaint.entity';
import { CertificateEmailLog } from './entities/certificate-email-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CertificateComplaint, CertificateEmailLog, Registration]),
    MailModule,
  ],
  controllers: [CertificatesController],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
