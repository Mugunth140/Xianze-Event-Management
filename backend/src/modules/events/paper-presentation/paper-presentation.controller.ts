import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Logger,
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
import { exec } from 'child_process';
import type { Response } from 'express';
import { createReadStream, existsSync, unlinkSync } from 'fs';
import { diskStorage } from 'multer';
import { basename, extname, join } from 'path';
import { promisify } from 'util';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../users/user.entity';
import { PaperPresentationService, UpdateSubmissionDto } from './paper-presentation.service';
import { PaperSubmissionStatus } from './paper-submission.entity';

const execAsync = promisify(exec);

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

@Controller('paper-presentation')
export class PaperPresentationController {
  private readonly logger = new Logger(PaperPresentationController.name);

  constructor(private readonly service: PaperPresentationService) {}

  /**
   * Convert PPT/PPTX to PDF using LibreOffice
   */
  private async convertToPdf(inputPath: string, outputDir: string): Promise<string | null> {
    const ext = extname(inputPath).toLowerCase();

    // If already PDF, no conversion needed
    if (ext === '.pdf') {
      return null;
    }

    try {
      // Use LibreOffice headless mode to convert
      const command = `libreoffice --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`;
      this.logger.log(`Converting PPT to PDF: ${command}`);

      await execAsync(command, { timeout: 60000 }); // 60s timeout

      // The output filename will be the same as input but with .pdf extension
      const inputFilename = basename(inputPath);
      const pdfFilename = inputFilename.replace(/\.(ppt|pptx)$/i, '.pdf');
      const pdfPath = join(outputDir, pdfFilename);

      if (existsSync(pdfPath)) {
        this.logger.log(`PDF created: ${pdfPath}`);
        return `/presentations/${pdfFilename}`;
      } else {
        this.logger.error('PDF file not created after conversion');
        return null;
      }
    } catch (error) {
      this.logger.error(`PPT to PDF conversion failed: ${error}`);
      return null;
    }
  }

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

    // Convert PPT/PPTX to PDF for slideshow
    const pdfPath = await this.convertToPdf(file.path, '/data/presentations');

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
