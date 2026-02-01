import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import * as XLSX from 'xlsx';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/user.entity';
import { ExportsService } from './exports.service';

@Controller('exports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('registrations')
  async exportRegistrations(@Query('event') event: string | undefined, @Res() res: Response) {
    const rows = await this.exportsService.getRegistrations(event);
    return this.sendExcel(res, rows, event ? `registrations-${event}` : 'registrations');
  }

  @Get('attendance')
  async exportAttendance(@Query('event') event: string | undefined, @Res() res: Response) {
    const rows = await this.exportsService.getAttendance(event);
    return this.sendExcel(res, rows, event ? `attendance-${event}` : 'attendance');
  }

  @Get('event-participation')
  async exportEventParticipation(@Query('eventSlug') eventSlug: string, @Res() res: Response) {
    const rows = await this.exportsService.getEventParticipation(eventSlug);
    return this.sendExcel(res, rows, `event-participation-${eventSlug}`);
  }

  @Get('round-participation')
  async exportRoundParticipation(@Query('eventSlug') eventSlug: string, @Res() res: Response) {
    const rows = await this.exportsService.getRoundParticipation(eventSlug);
    return this.sendExcel(res, rows, `round-participation-${eventSlug}`);
  }

  @Get('users')
  async exportUsers(@Res() res: Response) {
    const rows = await this.exportsService.getUsers();
    return this.sendExcel(res, rows, 'users');
  }

  private sendExcel(res: Response, data: unknown[], fileName: string) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    return res.send(buffer);
  }
}
