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
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { createReadStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../users/user.entity';
import { ThinkLinkService } from './think-link.service';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

// Generate secure filename
const generateFilename = (originalname: string): string => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 10);
  const ext = extname(originalname).toLowerCase();
  return `presentation-${timestamp}-${randomStr}${ext}`;
};

// Ensure upload directory exists
const containerUploadRoot = '/data';
const localUploadRoot = join(process.cwd(), 'data');
let uploadRoot = process.env.UPLOAD_ROOT || containerUploadRoot;

try {
  if (!existsSync(uploadRoot)) {
    mkdirSync(uploadRoot, { recursive: true });
  }
} catch {
  uploadRoot = localUploadRoot;
  if (!existsSync(uploadRoot)) {
    mkdirSync(uploadRoot, { recursive: true });
  }
}

const uploadDir = join(uploadRoot, 'think-link');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

@Controller('think-link')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ThinkLinkController {
  constructor(private readonly service: ThinkLinkService) { }

  /**
   * POST /api/think-link/presentations
   * Upload a new presentation (PDF)
   */
  @Post('presentations')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (
          _req: Request,
          file: MulterFile,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          cb(null, generateFilename(file.originalname));
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
      fileFilter: (
        _req: Request,
        file: MulterFile,
        cb: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        const allowedMimes = [
          'application/pdf',
          'application/x-pdf',
          'application/acrobat',
          'applications/vnd.pdf',
          'text/pdf',
          'text/x-pdf',
          'application/octet-stream', // Fallback
        ];
        if (
          !allowedMimes.includes(file.mimetype) &&
          !file.originalname.toLowerCase().endsWith('.pdf')
        ) {
          return cb(
            new BadRequestException(`Only PDF files are allowed (got ${file.mimetype})`),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadPresentation(@UploadedFile() file: MulterFile, @Body('name') name?: string) {
    if (!file) {
      throw new BadRequestException('PDF file is required');
    }

    const presentationName = name || file.originalname.replace(/\.[^/.]+$/, '');
    const filePath = `think-link/${file.filename}`;
    const presentation = await this.service.create(presentationName, filePath);
    return { success: true, data: presentation };
  }

  /**
   * GET /api/think-link/presentations
   * List all presentations
   */
  @Get('presentations')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.MEMBER)
  async findAll() {
    const presentations = await this.service.findAll();
    return { success: true, data: presentations };
  }

  /**
   * GET /api/think-link/stats
   * Get presentation statistics
   */
  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async getStats() {
    const stats = await this.service.getStats();
    return { success: true, data: stats };
  }

  /**
   * GET /api/think-link/presentations/:id
   * Get single presentation by ID
   */
  @Get('presentations/:id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.MEMBER)
  async findById(@Param('id', ParseIntPipe) id: number) {
    const presentation = await this.service.findById(id);
    return { success: true, data: presentation };
  }

  /**
   * GET /api/think-link/presentations/:id/file
   * Serve the PDF file
   */
  @Get('presentations/:id/file')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.MEMBER)
  async getFile(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const presentation = await this.service.findById(id);
    const safeRelativePath = presentation.filePath.replace(/^\/+/, '');
    const filePath = join(uploadRoot, safeRelativePath);

    if (!existsSync(filePath)) {
      throw new BadRequestException('File not found');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${presentation.name}.pdf"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const stream = createReadStream(filePath);
    stream.pipe(res);
  }

  /**
   * PATCH /api/think-link/presentations/:id
   * Update presentation name or slide count
   */
  @Patch('presentations/:id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name?: string; totalSlides?: number },
  ) {
    let presentation = await this.service.findById(id);

    if (body.name) {
      presentation = await this.service.updateName(id, body.name);
    }
    if (typeof body.totalSlides === 'number') {
      presentation = await this.service.updateTotalSlides(id, body.totalSlides);
    }

    return { success: true, data: presentation };
  }

  /**
   * DELETE /api/think-link/presentations/:id
   * Delete a presentation
   */
  @Delete('presentations/:id')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id', ParseIntPipe) id: number) {
    const presentation = await this.service.findById(id);

    // Delete file
    const safeRelativePath = presentation.filePath.replace(/^\/+/, '');
    const filePath = join(uploadRoot, safeRelativePath);
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
      } catch {
        /* ignore */
      }
    }

    await this.service.delete(id);
    return { success: true, message: 'Presentation deleted' };
  }
}
