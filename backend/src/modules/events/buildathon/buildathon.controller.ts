import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as QRCode from 'qrcode';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../users/user.entity';
import {
  CreateTeamDto,
  UpdateApiStateDto,
  UpdateTeamDto,
  UploadDocumentDto,
} from './buildathon.dto';
import { BuildathonService } from './buildathon.service';

// File upload config - use /data in Docker, fallback to ./data locally
const isDocker = process.env.NODE_ENV === 'production' || fs.existsSync('/data');
const uploadsDir = isDocker
  ? '/data/uploads/buildathon'
  : path.join(process.cwd(), 'data', 'uploads', 'buildathon');

// Ensure directory exists with proper error handling
const ensureUploadsDir = () => {
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  } catch {
    // Directory might already exist or be created by Docker
  }
};

const storage = diskStorage({
  destination: (
    _req: unknown,
    _file: unknown,
    cb: (error: Error | null, destination: string) => void,
  ) => {
    ensureUploadsDir();
    cb(null, uploadsDir);
  },
  filename: (
    _req: unknown,
    file: { originalname: string },
    cb: (error: Error | null, filename: string) => void,
  ) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  },
});

@Controller('buildathon')
export class BuildathonController {
  constructor(private readonly service: BuildathonService) {}

  // ========================
  // TEAM REGISTRATION (Public)
  // ========================

  @Post('teams')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async registerTeam(@Body() dto: CreateTeamDto) {
    if (!dto.teamName || !dto.participant1) {
      throw new BadRequestException('Team name and at least one participant are required');
    }
    const team = await this.service.createTeam(dto);
    return { success: true, data: team };
  }

  @Get('teams')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async getAllTeams() {
    const teams = await this.service.getAllTeams();
    return { success: true, data: teams };
  }

  @Delete('teams/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteTeam(@Param('id', ParseIntPipe) id: number) {
    await this.service.deleteTeam(id);
    return { success: true, message: 'Team deleted' };
  }

  @Patch('teams/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async updateTeam(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTeamDto) {
    const team = await this.service.updateTeam(id, dto);
    return { success: true, data: team };
  }

  // ========================
  // DOCUMENT MANAGEMENT (Admin)
  // ========================

  @Post('documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @UseInterceptors(FileInterceptor('file', { storage }))
  async uploadDocument(
    @UploadedFile() file: { path: string; originalname: string },
    @Body() dto: UploadDocumentDto,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (!dto.title) {
      throw new BadRequestException('Title is required');
    }

    const doc = await this.service.createDocument(dto, file.path);

    // Generate QR code pointing to document URL
    const baseUrl = process.env.CORS_ORIGIN || 'https://xianze.tech';
    const docUrl = `${baseUrl}/api/buildathon/documents/${doc.id}/view`;
    const qrPath = path.join(uploadsDir, `qr-${doc.id}.png`);

    // Ensure directory exists before writing QR
    ensureUploadsDir();

    await QRCode.toFile(qrPath, docUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#6D40D4', light: '#FFFFFF' },
    });

    const updatedDoc = await this.service.updateDocumentQr(doc.id, qrPath);
    return { success: true, data: updatedDoc };
  }

  @Get('documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async getAllDocuments() {
    const docs = await this.service.getAllDocuments();
    return { success: true, data: docs };
  }

  @Patch('documents/:id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async activateDocument(@Param('id', ParseIntPipe) id: number) {
    const doc = await this.service.setActiveDocument(id);
    return { success: true, data: doc };
  }

  @Delete('documents/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteDocument(@Param('id', ParseIntPipe) id: number) {
    await this.service.deleteDocument(id);
    return { success: true, message: 'Document deleted' };
  }

  // Public document view (QR redirect target)
  @Get('documents/:id/view')
  async viewDocument(@Param('id', ParseIntPipe) id: number, @Req() _req: Request) {
    const docs = await this.service.getAllDocuments();
    const doc = docs.find((d) => d.id === id);
    if (!doc) {
      throw new BadRequestException('Document not found');
    }
    // Return file path info or redirect logic
    return {
      success: true,
      data: {
        title: doc.title,
        description: doc.description,
        downloadUrl: `/api/buildathon/documents/${id}/download`,
      },
    };
  }

  // ========================
  // API STATE CONTROL (Admin)
  // ========================

  @Get('api-state')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async getApiState() {
    const state = await this.service.getApiState();
    return { success: true, data: state };
  }

  @Patch('api-state')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async updateApiState(@Body() dto: UpdateApiStateDto) {
    const state = await this.service.updateApiState(dto);
    return { success: true, data: state };
  }

  // Generate or regenerate Registration Form QR Code
  @Post('generate-registration-qr')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async generateRegistrationQr() {
    const baseUrl = process.env.CORS_ORIGIN || 'https://xianze.tech';
    const registrationUrl = `${baseUrl}/events/buildathon/register`;
    const qrPath = path.join(uploadsDir, 'registration-qr.png');

    // Ensure directory exists before writing QR
    ensureUploadsDir();

    await QRCode.toFile(qrPath, registrationUrl, {
      width: 400,
      margin: 2,
      color: { dark: '#6D40D4', light: '#FFFFFF' },
    });

    const state = await this.service.updateRegistrationQr(qrPath);
    return {
      success: true,
      data: {
        registrationQrPath: state.registrationQrPath,
        registrationUrl,
      },
    };
  }

  // ========================
  // DATA ENDPOINTS (Public - controlled by API state)
  // ========================

  @Get('data/customers')
  @SkipThrottle()
  async getCustomers(@Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const data = await this.service.getCustomers(ip, userAgent);
    return { success: true, data };
  }

  @Get('data/orders')
  @SkipThrottle()
  async getOrders(@Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const data = await this.service.getOrders(ip, userAgent);
    return { success: true, data };
  }

  @Get('data/products')
  @SkipThrottle()
  async getProducts(@Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const data = await this.service.getProducts(ip, userAgent);
    return { success: true, data };
  }

  // ========================
  // METRICS (Admin)
  // ========================

  @Get('metrics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async getMetrics() {
    const metrics = await this.service.getMetrics();
    return { success: true, data: metrics };
  }

  @Post('metrics/reset')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @HttpCode(HttpStatus.OK)
  async resetMetrics() {
    await this.service.resetMetrics();
    return { success: true, message: 'Metrics reset' };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async getStats() {
    const stats = await this.service.getStats();
    return { success: true, data: stats };
  }
}
