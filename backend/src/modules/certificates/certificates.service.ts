import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { Repository } from 'typeorm';
import { CreateCertificateComplaintDto } from './dto/create-certificate-complaint.dto';
import { CertificateComplaint } from './entities/certificate-complaint.entity';

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);
  private readonly certificatesDir: string;

  constructor(
    @InjectRepository(CertificateComplaint)
    private readonly complaintRepo: Repository<CertificateComplaint>,
  ) {
    // Same pattern as uploads directory resolution in main.ts
    this.certificatesDir = existsSync('/data/certificates')
      ? '/data/certificates'
      : join(process.cwd(), 'data', 'certificates');

    // Ensure directory exists
    if (!existsSync(this.certificatesDir)) {
      mkdirSync(this.certificatesDir, { recursive: true });
    }

    this.logger.log(`Certificates directory: ${this.certificatesDir}`);
  }

  /**
   * Lookup all certificate PDFs for a given email.
   *
   * Naming convention: {emailPrefix}_1.pdf, {emailPrefix}_2.pdf, ...
   * where emailPrefix is the part before @ in the email.
   * e.g. mugunth140@gmail.com → mugunth140_1.pdf, mugunth140_2.pdf
   *
   * All PDFs live flat inside the certificates directory.
   */
  async lookupCertificates(email: string): Promise<{ files: string[] }> {
    const normalizedEmail = email.toLowerCase().trim();
    const emailPrefix = normalizedEmail.split('@')[0];

    if (!existsSync(this.certificatesDir)) {
      return { files: [] };
    }

    try {
      const allFiles = readdirSync(this.certificatesDir);
      const pattern = new RegExp(
        `^${emailPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}_\\d+\\.pdf$`,
        'i',
      );
      const files = allFiles.filter((f) => pattern.test(f)).sort();
      return { files };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error reading certificates for ${normalizedEmail}: ${msg}`);
      return { files: [] };
    }
  }

  /**
   * Get the absolute file path for a specific certificate.
   * Includes directory traversal protection.
   */
  getCertificatePath(email: string, filename: string): string {
    const filePath = join(this.certificatesDir, filename);

    // Security: prevent directory traversal
    const resolvedPath = resolve(filePath);
    const resolvedDir = resolve(this.certificatesDir);
    if (!resolvedPath.startsWith(resolvedDir)) {
      throw new NotFoundException('Certificate not found');
    }

    if (!existsSync(filePath)) {
      throw new NotFoundException('Certificate not found');
    }

    return resolvedPath;
  }

  // ── Certificate Complaints ──────────────────────────────────────────

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
