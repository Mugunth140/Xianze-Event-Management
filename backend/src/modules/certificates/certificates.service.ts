import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { Registration } from '../registration/registration.entity';
import { CreateCertificateComplaintDto } from './dto/create-certificate-complaint.dto';
import { CertificateComplaint } from './entities/certificate-complaint.entity';
import { CertificateEmailLog } from './entities/certificate-email-log.entity';

export interface BatchSendResult {
  batchId: string;
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  noFiles: number;
  results: Array<{
    email: string;
    status: 'success' | 'failed' | 'no-files' | 'skipped';
    filenames: string[];
    error?: string;
  }>;
}

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);
  private readonly certificatesDir: string;

  constructor(
    @InjectRepository(CertificateComplaint)
    private readonly complaintRepo: Repository<CertificateComplaint>,
    @InjectRepository(CertificateEmailLog)
    private readonly emailLogRepo: Repository<CertificateEmailLog>,
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
    private readonly mailService: MailService,
  ) {
    // Same pattern as uploads directory resolution in main.ts
    this.certificatesDir = existsSync('/data/certificates')
      ? '/data/certificates'
      : join(process.cwd(), 'data', 'certificates');

    // Try to ensure directory exists (local dev only)
    if (!existsSync(this.certificatesDir)) {
      try {
        mkdirSync(this.certificatesDir, { recursive: true });
        this.logger.log(`Created certificates directory: ${this.certificatesDir}`);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Could not create certificates directory (will use existing mount): ${msg}`,
        );
      }
    } else {
      this.logger.log(`Certificates directory: ${this.certificatesDir}`);
    }
  }

  // ── Batch Email Sending ─────────────────────────────────────────────

  /**
   * Scan certificates directory and send emails to all checked-in participants.
   *
   * Naming convention: {fullEmail}_{eventSlug}.pdf
   * e.g. mugunth140@gmail.com_buildathon.pdf, mugunth140@kgcas.edu_ctrl-quiz.pdf
   * Uses full email for direct lookup — no prefix ambiguity.
   * Only sends to participants who checked in on event day.
   */
  async sendBatchCertificates(): Promise<BatchSendResult> {
    const batchId = randomBytes(4).toString('hex');
    this.logger.log(`Starting batch certificate send [${batchId}]`);

    // 1. Scan directory for all PDF files
    if (!existsSync(this.certificatesDir)) {
      return { batchId, total: 0, sent: 0, failed: 0, skipped: 0, noFiles: 0, results: [] };
    }

    const allFiles = readdirSync(this.certificatesDir).filter((f) =>
      f.toLowerCase().endsWith('.pdf'),
    );

    if (allFiles.length === 0) {
      this.logger.warn(`[${batchId}] No PDF files found in certificates directory`);
      return { batchId, total: 0, sent: 0, failed: 0, skipped: 0, noFiles: 0, results: [] };
    }

    // 2. Group files by full email address
    //    Pattern: {fullEmail}_{eventSlug}.pdf  e.g. mugunth140@gmail.com_buildathon.pdf
    const emailMap = new Map<string, string[]>();
    const filePattern = /^(.+)_([a-z0-9-]+)\.pdf$/i;

    for (const file of allFiles) {
      const match = file.match(filePattern);
      if (match) {
        const email = match[1].toLowerCase();
        if (!emailMap.has(email)) {
          emailMap.set(email, []);
        }
        emailMap.get(email)!.push(file);
      }
    }

    this.logger.log(
      `[${batchId}] Found ${allFiles.length} PDF(s) for ${emailMap.size} unique email(s)`,
    );

    // 3. For each email, verify registration + check-in, then send
    const results: BatchSendResult['results'] = [];
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const [email, filenames] of emailMap) {
      const sortedFiles = filenames.sort();

      // Find registration with exact email match
      const registration = await this.registrationRepo.findOne({
        where: { email },
        order: { createdAt: 'DESC' },
      });

      if (!registration) {
        this.logger.warn(`[${batchId}] No registration found for email: ${email}`);
        await this.emailLogRepo.save(
          this.emailLogRepo.create({
            batchId,
            email,
            emailPrefix: email,
            filenames: JSON.stringify(sortedFiles),
            status: 'failed',
            error: 'No registration found for this email',
          }),
        );
        results.push({
          email,
          status: 'failed',
          filenames: sortedFiles,
          error: 'No registration found',
        });
        failed++;
        continue;
      }

      // Check if participant checked in on event day
      if (!registration.isCheckedIn) {
        this.logger.warn(`[${batchId}] Skipping ${email} — not checked in`);
        await this.emailLogRepo.save(
          this.emailLogRepo.create({
            batchId,
            email,
            emailPrefix: email,
            filenames: JSON.stringify(sortedFiles),
            status: 'skipped',
            error: 'Participant did not check in on event day',
          }),
        );
        results.push({
          email,
          status: 'skipped',
          filenames: sortedFiles,
          error: 'Not checked in',
        });
        skipped++;
        continue;
      }

      const name = registration.name;

      // Build attachment list
      const attachments = sortedFiles.map((f) => ({
        filename: f,
        path: join(this.certificatesDir, f),
      }));

      // Send email
      const success = await this.mailService.sendCertificateEmail(email, name, attachments);

      const status = success ? 'success' : 'failed';
      const error = success ? null : 'Email delivery failed';

      // Log to database
      await this.emailLogRepo.save(
        this.emailLogRepo.create({
          batchId,
          email,
          emailPrefix: email,
          filenames: JSON.stringify(sortedFiles),
          status,
          error,
        }),
      );

      results.push({
        email,
        status,
        filenames: sortedFiles,
        error: error || undefined,
      });

      if (success) {
        sent++;
      } else {
        failed++;
      }
    }

    this.logger.log(
      `[${batchId}] Batch complete: ${sent} sent, ${failed} failed, ${skipped} skipped out of ${emailMap.size}`,
    );

    return {
      batchId,
      total: emailMap.size,
      sent,
      failed,
      skipped,
      noFiles: 0,
      results,
    };
  }

  /**
   * Get all email send logs, ordered by most recent first.
   */
  async findAllEmailLogs(): Promise<CertificateEmailLog[]> {
    return this.emailLogRepo.find({ order: { sentAt: 'DESC' } });
  }

  /**
   * Get email logs for a specific batch.
   */
  async findEmailLogsByBatch(batchId: string): Promise<CertificateEmailLog[]> {
    return this.emailLogRepo.find({ where: { batchId }, order: { sentAt: 'DESC' } });
  }

  /**
   * Resend a previously failed or skipped certificate email.
   */
  async resendFailedEmail(logId: number): Promise<{ success: boolean; error?: string }> {
    const log = await this.emailLogRepo.findOne({ where: { id: logId } });
    if (!log) {
      throw new NotFoundException('Email log entry not found');
    }

    if (log.status === 'success') {
      return { success: false, error: 'Email was already sent successfully' };
    }

    const email = log.email;
    const filenames: string[] = JSON.parse(log.filenames);

    // Look up registration for the name
    const registration = await this.registrationRepo.findOne({
      where: { email },
    });

    const name = registration?.name || 'Participant';

    // Build attachment list — verify files still exist
    const attachments = filenames
      .filter((f) => existsSync(join(this.certificatesDir, f)))
      .map((f) => ({
        filename: f,
        path: join(this.certificatesDir, f),
      }));

    if (attachments.length === 0) {
      log.status = 'failed';
      log.error = 'Certificate PDF files not found in directory';
      await this.emailLogRepo.save(log);
      return { success: false, error: 'Certificate files not found' };
    }

    const success = await this.mailService.sendCertificateEmail(email, name, attachments);

    log.status = success ? 'success' : 'failed';
    log.error = success ? null : 'Email delivery failed on resend';
    await this.emailLogRepo.save(log);

    return { success, error: success ? undefined : 'Email delivery failed' };
  }

  /**
   * Send a single certificate email manually from contact@xianze.tech.
   */
  async sendSingleCertificateEmail(
    email: string,
    name: string,
    filename: string,
    fileBuffer: Buffer,
  ): Promise<{ success: boolean; logId: number; error?: string }> {
    const batchId = `manual-${randomBytes(4).toString('hex')}`;

    const success = await this.mailService.sendCertificateEmailFromContact(email, name, [
      { filename, content: fileBuffer },
    ]);

    const log = await this.emailLogRepo.save(
      this.emailLogRepo.create({
        batchId,
        email,
        emailPrefix: email,
        filenames: JSON.stringify([filename]),
        status: success ? 'success' : 'failed',
        error: success ? null : 'Email delivery failed',
      }),
    );

    return { success, logId: log.id, error: success ? undefined : 'Email delivery failed' };
  }

  // ── Email Verification ──────────────────────────────────────────────

  /**
   * Check if an email address exists in the registrations table.
   */
  async checkEmailRegistered(email: string): Promise<boolean> {
    if (!email) return false;
    const normalizedEmail = email.toLowerCase().trim();
    const registration = await this.registrationRepo.findOne({
      where: { email: normalizedEmail },
    });
    return !!registration;
  }

  // ── Certificate Requests ────────────────────────────────────────────

  async createComplaint(dto: CreateCertificateComplaintDto): Promise<CertificateComplaint> {
    const complaint = this.complaintRepo.create({
      name: dto.name.trim(),
      email: dto.email.toLowerCase().trim(),
      events: JSON.stringify(dto.events),
    });
    return this.complaintRepo.save(complaint);
  }

  async findAllComplaints(): Promise<CertificateComplaint[]> {
    return this.complaintRepo.find({ order: { createdAt: 'DESC' } });
  }

  async deleteComplaint(id: number): Promise<void> {
    const complaint = await this.complaintRepo.findOne({ where: { id } });
    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }
    await this.complaintRepo.remove(complaint);
  }
}
