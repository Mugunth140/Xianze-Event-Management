import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
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
import { LookupCertificatesDto } from './dto/lookup-certificates.dto';

@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  // ── Public Endpoints ────────────────────────────────────────────────

  /**
   * POST /api/certificates/lookup
   * Public — look up available certificates by email
   */
  @Post('lookup')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async lookup(@Body() dto: LookupCertificatesDto) {
    const result = await this.certificatesService.lookupCertificates(dto.email);
    return { success: true, data: result };
  }

  /**
   * GET /api/certificates/download?email=...&file=...
   * Public — download a specific certificate PDF
   */
  @Get('download')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async download(@Query('email') email: string, @Query('file') file: string, @Res() res: Response) {
    const filePath = this.certificatesService.getCertificatePath(email, file);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${file}"`);
    return res.sendFile(filePath);
  }

  /**
   * POST /api/certificates/complaints
   * Public — submit a certificate complaint/request
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Certificate Complaints');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="certificate-complaints-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    return res.send(buffer);
  }

  /**
   * GET /api/certificates/complaints
   * Admin — list all complaints
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
   * Admin — delete a complaint
   */
  @Delete('complaints/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteComplaint(@Param('id') id: string) {
    await this.certificatesService.deleteComplaint(+id);
    return { success: true, message: 'Complaint deleted' };
  }
}
