import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { spawn } from 'child_process';
import type { Response } from 'express';
import { createReadStream, existsSync, unlinkSync } from 'fs';
import { diskStorage } from 'multer';
import { basename, extname, join } from 'path';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../users/user.entity';
import { PaperPresentationService, UpdateSubmissionDto } from './paper-presentation.service';
import { PaperSubmissionStatus } from './paper-submission.entity';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

// Generate secure filename
const generateFilename = (originalname: string): string => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 10);
  const ext = extname(originalname).toLowerCase();
  return `paper-${timestamp}-${randomStr}${ext}`;
};

const convertSlidesToPdf = async (absolutePath: string): Promise<string> => {
  const outputDir = '/data/presentations';
  const baseName = basename(absolutePath, extname(absolutePath));
  const pdfFilename = `${baseName}.pdf`;

  return new Promise((resolve, reject) => {
    const proc = spawn('soffice', [
      '--headless',
      '--convert-to',
      'pdf',
      '--outdir',
      outputDir,
      absolutePath,
    ]);

    let stderr = '';
    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('error', (err) => reject(err));
    proc.on('close', (code) => {
      const pdfPath = join(outputDir, pdfFilename);
      if (code === 0 && existsSync(pdfPath)) {
        resolve(`/presentations/${pdfFilename}`);
        return;
      }
      reject(new Error(stderr || 'Conversion failed'));
    });
  });
};

@Controller('paper-presentation')
export class PaperPresentationController {
  constructor(private readonly service: PaperPresentationService) {}

  /**
   * POST /api/paper-presentation/submit
   * Public endpoint for submitting papers
   */
  @Post('submit')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 per minute
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('slides', {
      storage: diskStorage({
        destination: '/data/presentations',
        filename: (
          _req: Request,
          file: MulterFile,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          cb(null, generateFilename(file.originalname));
        },
      }),
      limits: {
        fileSize: 15 * 1024 * 1024, // 15MB max
      },
      fileFilter: (
        _req: Request,
        file: MulterFile,
        cb: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        const allowedMimes = ['application/pdf'];
        const allowedExts = ['.pdf'];
        const ext = extname(file.originalname).toLowerCase();

        if (!allowedMimes.includes(file.mimetype) && !allowedExts.includes(ext)) {
          return cb(new BadRequestException('Only PDF files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async submit(
    @Body('member1') member1: string,
    @Body('member2') member2: string,
    @Body('college') college: string,
    @Body('topic') topic: string,
    @Body('phone') phone: string,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      }),
    )
    file: MulterFile,
  ) {
    // Validate required fields
    if (!member1 || !college || !topic || !phone) {
      throw new BadRequestException('All required fields must be provided');
    }

    const derivedTeamName = member1.trim();

    // Build team members array
    const teamMembers = [member1];
    if (member2 && member2.trim()) {
      teamMembers.push(member2.trim());
    }

    const slidePath = `/presentations/${file.filename}`;
    const uploadExt = extname(file.originalname).toLowerCase();

    let pdfPath: string | null = null;
    if (uploadExt === '.pdf') {
      pdfPath = slidePath;
    } else if (uploadExt === '.ppt' || uploadExt === '.pptx') {
      try {
        pdfPath = await convertSlidesToPdf(join('/data', slidePath));
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        throw new BadRequestException(
          'Failed to convert PPT/PPTX to PDF. Please upload a PDF file.',
        );
      }
    }

    const submission = await this.service.create(
      { teamName: derivedTeamName, teamMembers, college, topic, phone },
      slidePath,
      pdfPath,
    );

    return {
      success: true,
      message: 'Paper submitted successfully!',
      submissionId: submission.id,
    };
  }

  /**
   * GET /api/paper-presentation/submissions
   * List all submissions (Coordinator/Admin)
   */
  @Get('submissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async findAll() {
    const submissions = await this.service.findAll();
    return { success: true, data: submissions };
  }

  /**
   * GET /api/paper-presentation/stats
   * Get submission statistics
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async getStats() {
    const stats = await this.service.getStats();
    return { success: true, data: stats };
  }

  /**
   * GET /api/paper-presentation/submissions/:id
   * Get single submission
   */
  @Get('submissions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.MEMBER)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const submission = await this.service.findById(id);
    return { success: true, data: submission };
  }

  /**
   * PATCH /api/paper-presentation/submissions/:id/status
   * Update submission status
   */
  @Patch('submissions/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: PaperSubmissionStatus,
  ) {
    if (!Object.values(PaperSubmissionStatus).includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    const submission = await this.service.updateStatus(id, status);
    return { success: true, data: submission };
  }

  /**
   * PATCH /api/paper-presentation/submissions/:id
   * Update submission details (Coordinator/Admin)
   */
  @Patch('submissions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async updateSubmission(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSubmissionDto) {
    if (dto.college !== undefined && !dto.college.trim()) {
      throw new BadRequestException('College cannot be empty');
    }
    if (dto.topic !== undefined && !dto.topic.trim()) {
      throw new BadRequestException('Topic cannot be empty');
    }
    if (dto.phone !== undefined && !dto.phone.trim()) {
      throw new BadRequestException('Phone cannot be empty');
    }
    if (dto.teamMembers !== undefined) {
      const members = dto.teamMembers.map((member) => member.trim()).filter(Boolean);
      if (members.length === 0) {
        throw new BadRequestException('At least one team member is required');
      }
      dto.teamMembers = members;
    }

    const submission = await this.service.updateSubmission(id, dto);
    return { success: true, data: submission };
  }

  /**
   * POST /api/paper-presentation/submissions/:id/slides
   * Replace submission slides (Coordinator/Admin)
   */
  @Post('submissions/:id/slides')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @UseInterceptors(
    FileInterceptor('slides', {
      storage: diskStorage({
        destination: '/data/presentations',
        filename: (
          _req: Request,
          file: MulterFile,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          cb(null, generateFilename(file.originalname));
        },
      }),
      limits: {
        fileSize: 15 * 1024 * 1024, // 15MB max
      },
      fileFilter: (
        _req: Request,
        file: MulterFile,
        cb: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        const allowedMimes = [
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/pdf',
        ];
        const allowedExts = ['.ppt', '.pptx', '.pdf'];
        const ext = extname(file.originalname).toLowerCase();

        if (!allowedMimes.includes(file.mimetype) && !allowedExts.includes(ext)) {
          return cb(new BadRequestException('Only PPT, PPTX, and PDF files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async updateSlides(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
      }),
    )
    file: MulterFile,
  ) {
    const submission = await this.service.findById(id);
    const newSlidePath = `/presentations/${file.filename}`;
    const uploadExt = extname(file.originalname).toLowerCase();

    let newPdfPath: string | null = null;
    if (uploadExt === '.pdf') {
      newPdfPath = newSlidePath;
    } else if (uploadExt === '.ppt' || uploadExt === '.pptx') {
      try {
        newPdfPath = await convertSlidesToPdf(join('/data', newSlidePath));
      } catch {
        const newFilePath = join('/data', newSlidePath);
        if (existsSync(newFilePath)) {
          try {
            unlinkSync(newFilePath);
          } catch {
            /* ignore */
          }
        }
        throw new BadRequestException(
          'Failed to convert PPT/PPTX to PDF. Please upload a PDF file.',
        );
      }
    }

    const oldSlidePath = join('/data', submission.slidePath);
    if (existsSync(oldSlidePath)) {
      try {
        unlinkSync(oldSlidePath);
      } catch {
        /* ignore */
      }
    }

    if (submission.pdfPath && submission.pdfPath !== submission.slidePath) {
      const oldPdfPath = join('/data', submission.pdfPath);
      if (existsSync(oldPdfPath)) {
        try {
          unlinkSync(oldPdfPath);
        } catch {
          /* ignore */
        }
      }
    }

    const updated = await this.service.updateSlides(id, newSlidePath, newPdfPath);
    return { success: true, data: updated };
  }

  /**
   * GET /api/paper-presentation/slides/:id
   * Download original slides for a submission
   */
  @Get('slides/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async downloadSlides(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const submission = await this.service.findById(id);
    const filePath = join('/data', submission.slidePath);

    if (!existsSync(filePath)) {
      throw new BadRequestException('Slide file not found');
    }

    const filename = basename(submission.slidePath);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const stream = createReadStream(filePath);
    stream.pipe(res);
  }

  /**
   * GET /api/paper-presentation/slideshow/:id
   * Get PDF for slideshow presentation
   */
  @Get('slideshow/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async getSlideshow(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const submission = await this.service.findById(id);

    // Use PDF if available, otherwise check if original is PDF
    let pdfPath: string;
    if (submission.pdfPath) {
      pdfPath = join('/data', submission.pdfPath);
    } else if (submission.slidePath.toLowerCase().endsWith('.pdf')) {
      pdfPath = join('/data', submission.slidePath);
    } else if (
      submission.slidePath.toLowerCase().endsWith('.ppt') ||
      submission.slidePath.toLowerCase().endsWith('.pptx')
    ) {
      try {
        const convertedPdfPath = await convertSlidesToPdf(join('/data', submission.slidePath));
        await this.service.updatePdfPath(submission.id, convertedPdfPath);
        pdfPath = join('/data', convertedPdfPath);
      } catch {
        throw new BadRequestException('Unable to convert PPT/PPTX to PDF for slideshow.');
      }
    } else {
      throw new NotFoundException(
        'PDF not available for this presentation. Please re-upload in PDF format.',
      );
    }

    if (!existsSync(pdfPath)) {
      throw new NotFoundException('PDF file not found');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline'); // Display in browser, not download

    const stream = createReadStream(pdfPath);
    stream.pipe(res);
  }

  /**
   * DELETE /api/paper-presentation/submissions/:id
   * Delete a submission (Admin only)
   */
  @Delete('submissions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id', ParseIntPipe) id: number) {
    const submission = await this.service.findById(id);

    // Delete files
    const slidePath = join('/data', submission.slidePath);
    if (existsSync(slidePath)) {
      try {
        unlinkSync(slidePath);
      } catch {
        /* ignore */
      }
    }

    if (submission.pdfPath) {
      const pdfPath = join('/data', submission.pdfPath);
      if (existsSync(pdfPath)) {
        try {
          unlinkSync(pdfPath);
        } catch {
          /* ignore */
        }
      }
    }

    await this.service.delete(id);
    return { success: true, message: 'Submission deleted' };
  }
}
