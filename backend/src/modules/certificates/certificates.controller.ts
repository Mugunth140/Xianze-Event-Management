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
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
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
