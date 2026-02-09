import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { memoryStorage } from 'multer';
import * as XLSX from 'xlsx';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/user.entity';
import { CertificatesService } from './certificates.service';
import { CreateCertificateComplaintDto } from './dto/create-certificate-complaint.dto';

@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  // ── Public Endpoints ────────────────────────────────────────────────

  /**
   * POST /api/certificates/check-email
   * Public — verify if email is registered before submitting request
   */
  @Post('check-email')
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async checkEmail(@Body('email') email: string) {
    const registered = await this.certificatesService.checkEmailRegistered(email);
    return { success: true, data: { registered } };
  }

  /**
   * POST /api/certificates/complaints
   * Public — submit a certificate request
   */
  @Post('complaints')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  async createComplaint(@Body() dto: CreateCertificateComplaintDto) {
    const complaint = await this.certificatesService.createComplaint(dto);
    return { success: true, data: complaint };
  }

  // ── Admin Endpoints ─────────────────────────────────────────────────

  /**
   * POST /api/certificates/send-batch
   * Admin — trigger batch email send of all certificates
   */
  @Post('send-batch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async sendBatch() {
    const result = await this.certificatesService.sendBatchCertificates();
    return { success: true, data: result };
  }

  /**
   * POST /api/certificates/resend/:logId
   * Admin — resend a failed/skipped certificate email
   */
  @Post('resend/:logId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async resendEmail(@Param('logId') logId: string) {
    const result = await this.certificatesService.resendFailedEmail(+logId);
    return { success: result.success, data: result };
  }

  /**
   * POST /api/certificates/send-single
   * Admin — manually send a certificate email from contact@xianze.tech
   */
  @Post('send-single')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new Error('Only PDF files are allowed'), false);
        }
      },
    }),
  )
  @HttpCode(HttpStatus.OK)
  async sendSingle(
    @Body('email') email: string,
    @Body('name') name: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      return { success: false, error: 'PDF file is required' };
    }
    if (!email) {
      return { success: false, error: 'Email is required' };
    }
    const result = await this.certificatesService.sendSingleCertificateEmail(
      email.toLowerCase().trim(),
      name?.trim() || 'Participant',
      file.originalname,
      file.buffer,
    );
    return { success: result.success, data: result };
  }

  /**
   * GET /api/certificates/email-logs
   * Admin — get all email send logs
   */
  @Get('email-logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getEmailLogs() {
    const logs = await this.certificatesService.findAllEmailLogs();
    return { success: true, data: logs };
  }

  /**
   * GET /api/certificates/complaints/export
   * Admin — export complaints to Excel (must be before :id route)
   */
  @Get('complaints/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async exportComplaints(@Res() res: Response) {
    const complaints = await this.certificatesService.findAllComplaints();

    const data = complaints.map((c) => ({
      ID: c.id,
      Name: c.name,
      Email: c.email,
      Events: JSON.parse(c.events).join(', '),
      'Submitted At': c.createdAt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Certificate Requests');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="certificate-requests-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    return res.send(buffer);
  }

  /**
   * GET /api/certificates/complaints
   * Admin — list all certificate requests
   */
  @Get('complaints')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAllComplaints() {
    const complaints = await this.certificatesService.findAllComplaints();
    return { success: true, data: complaints };
  }

  /**
   * DELETE /api/certificates/complaints/:id
   * Admin — delete a certificate request
   */
  @Delete('complaints/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteComplaint(@Param('id') id: string) {
    await this.certificatesService.deleteComplaint(+id);
    return { success: true, message: 'Request deleted' };
  }
}
