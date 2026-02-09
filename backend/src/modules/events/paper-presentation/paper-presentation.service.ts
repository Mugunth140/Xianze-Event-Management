import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaperSubmission, PaperSubmissionStatus } from './paper-submission.entity';

export interface CreateSubmissionDto {
  teamName: string;
  teamMembers: string[];
  college: string;
  topic: string;
  phone: string;
}

export interface UpdateSubmissionDto {
  teamMembers?: string[];
  college?: string;
  topic?: string;
  phone?: string;
}

export interface SubmissionStats {
  total: number;
  submitted: number;
  presented: number;
  skipped: number;
  disqualified: number;
}

@Injectable()
export class PaperPresentationService {
  constructor(
    @InjectRepository(PaperSubmission)
    private readonly submissionRepository: Repository<PaperSubmission>,
  ) {}

  /**
   * Create a new paper submission
   */
  async create(
    dto: CreateSubmissionDto,
    slidePath: string,
    pdfPath: string | null,
  ): Promise<PaperSubmission> {
    const submission = this.submissionRepository.create({
      ...dto,
      slidePath,
      pdfPath,
      status: PaperSubmissionStatus.SUBMITTED,
    });
    return this.submissionRepository.save(submission);
  }

  /**
   * Find all submissions
   */
  async findAll(): Promise<PaperSubmission[]> {
    return this.submissionRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find submissions by status
   */
  async findByStatus(status: PaperSubmissionStatus): Promise<PaperSubmission[]> {
    return this.submissionRepository.find({
      where: { status },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find a single submission by ID
   */
  async findById(id: number): Promise<PaperSubmission> {
    const submission = await this.submissionRepository.findOne({ where: { id } });
    if (!submission) {
      throw new NotFoundException(`Submission with ID ${id} not found`);
    }
    return submission;
  }

  /**
   * Update submission status
   */
  async updateStatus(id: number, status: PaperSubmissionStatus): Promise<PaperSubmission> {
    const submission = await this.findById(id);
    submission.status = status;
    return this.submissionRepository.save(submission);
  }

  /**
   * Update submission details
   */
  async updateSubmission(id: number, dto: UpdateSubmissionDto): Promise<PaperSubmission> {
    const submission = await this.findById(id);
    if (dto.teamMembers !== undefined) submission.teamMembers = dto.teamMembers;
    if (dto.college !== undefined) submission.college = dto.college;
    if (dto.topic !== undefined) submission.topic = dto.topic;
    if (dto.phone !== undefined) submission.phone = dto.phone;
    return this.submissionRepository.save(submission);
  }

  /**
   * Update PDF path for a submission
   */
  async updatePdfPath(id: number, pdfPath: string): Promise<PaperSubmission> {
    const submission = await this.findById(id);
    submission.pdfPath = pdfPath;
    return this.submissionRepository.save(submission);
  }

  /**
   * Update slide and PDF paths for a submission
   */
  async updateSlides(
    id: number,
    slidePath: string,
    pdfPath: string | null,
  ): Promise<PaperSubmission> {
    const submission = await this.findById(id);
    submission.slidePath = slidePath;
    submission.pdfPath = pdfPath;
    return this.submissionRepository.save(submission);
  }

  /**
   * Get submission statistics
   */
  async getStats(): Promise<SubmissionStats> {
    const all = await this.submissionRepository.find();
    return {
      total: all.length,
      submitted: all.filter((s) => s.status === PaperSubmissionStatus.SUBMITTED).length,
      presented: all.filter((s) => s.status === PaperSubmissionStatus.PRESENTED).length,
      skipped: all.filter((s) => s.status === PaperSubmissionStatus.SKIPPED).length,
      disqualified: all.filter((s) => s.status === PaperSubmissionStatus.DISQUALIFIED).length,
    };
  }

  /**
   * Delete a submission
   */
  async delete(id: number): Promise<void> {
    const submission = await this.findById(id);
    await this.submissionRepository.remove(submission);
  }
}
