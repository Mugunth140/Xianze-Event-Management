import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { Like, Repository } from 'typeorm';
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
  noFiles: number;
  results: Array<{
    email: string;
    status: 'success' | 'failed' | 'no-files';
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
   * Scan certificates directory and send emails to all participants.
   *
   * Naming convention: {emailPrefix}_{eventSlug}.pdf
   * e.g. test_buildathon.pdf, test_ctrl-quiz.pdf
   * Looks up full email addresses from the registration table.
   */
  async sendBatchCertificates(): Promise<BatchSendResult> {
    const batchId = randomBytes(4).toString('hex');
    this.logger.log(`Starting batch certificate send [${batchId}]`);

    // 1. Scan directory for all PDF files
    if (!existsSync(this.certificatesDir)) {
      return { batchId, total: 0, sent: 0, failed: 0, noFiles: 0, results: [] };
    }

    const allFiles = readdirSync(this.certificatesDir).filter((f) =>
      f.toLowerCase().endsWith('.pdf'),
    );

    if (allFiles.length === 0) {
      this.logger.warn(`[${batchId}] No PDF files found in certificates directory`);
      return { batchId, total: 0, sent: 0, failed: 0, noFiles: 0, results: [] };
    }

    // 2. Group files by email prefix
    //    Pattern: {emailPrefix}_{eventSlug}.pdf  e.g. mugunth140_buildathon.pdf
    const prefixMap = new Map<string, string[]>();
    const filePattern = /^(.+?)_([a-z0-9-]+)\.pdf$/i;

    for (const file of allFiles) {
      const match = file.match(filePattern);
      if (match) {
        const prefix = match[1].toLowerCase();
        if (!prefixMap.has(prefix)) {
          prefixMap.set(prefix, []);
        }
        prefixMap.get(prefix)!.push(file);
      }
    }

    this.logger.log(
      `[${batchId}] Found ${allFiles.length} PDF(s) for ${prefixMap.size} unique prefix(es)`,
    );

    // 3. For each prefix, look up full email + name from registrations
    const results: BatchSendResult['results'] = [];
    let sent = 0;
    let failed = 0;

    for (const [prefix, filenames] of prefixMap) {
      // Find a registration with matching email prefix
      const registration = await this.registrationRepo.findOne({
        where: { email: Like(`${prefix}@%`) },
        order: { createdAt: 'DESC' },
      });

      if (!registration) {
        this.logger.warn(`[${batchId}] No registration found for prefix: ${prefix}`);
        // Log as failed — no email address found
        await this.emailLogRepo.save(
          this.emailLogRepo.create({
            batchId,
            email: `${prefix}@?`,
            emailPrefix: prefix,
            filenames: JSON.stringify(filenames.sort()),
            status: 'failed',
            error: 'No registration found for this email prefix',
          }),
        );
        results.push({
          email: `${prefix}@?`,
          status: 'failed',
          filenames: filenames.sort(),
          error: 'No registration found',
        });
        failed++;
        continue;
      }

      const email = registration.email;
      const name = registration.name;
      const sortedFiles = filenames.sort();

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
          emailPrefix: prefix,
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
      `[${batchId}] Batch complete: ${sent} sent, ${failed} failed out of ${prefixMap.size}`,
    );

    return {
      batchId,
      total: prefixMap.size,
      sent,
      failed,
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
