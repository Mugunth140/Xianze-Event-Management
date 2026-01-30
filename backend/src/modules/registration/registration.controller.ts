import {
    BadRequestException,
    Body,
    ConflictException,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Logger,
    MaxFileSizeValidator,
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
import { randomBytes } from 'crypto';
import type { Request, Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { diskStorage } from 'multer';
import { basename, extname, join } from 'path';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MailService } from '../mail/mail.service';
import { UserRole } from '../users/user.entity';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { Registration } from './registration.entity';
import { RegistrationService } from './registration.service';

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

// Generate secure random filename
const generateSecureFilename = (originalname: string): string => {
  const randomName = randomBytes(16).toString('hex');
  const ext = extname(originalname).toLowerCase();
  return `${Date.now()}-${randomName}${ext}`;
};

@Controller('register')
export class RegistrationController {
  private readonly logger = new Logger(RegistrationController.name);

  constructor(
    private readonly registrationService: RegistrationService,
    private readonly mailService: MailService,
  ) {}

  /**
   * POST /api/register
   *
   * Create a new event registration with payment screenshot.
   * Returns 201 on success, 409 if email already registered.
   * Sends confirmation email on successful registration.
   *
   * Rate limit: 5 requests per minute per IP to prevent abuse
   */
  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('screenshot', {
      storage: diskStorage({
        destination: '/data/transactions',
        filename: (
          _req: Request,
          file: MulterFile,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          cb(null, generateSecureFilename(file.originalname));
        },
      }),
      fileFilter: (
        _req: Request,
        file: MulterFile,
        cb: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        // Validate MIME type
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedMimes.includes(file.mimetype)) {
          return cb(new BadRequestException('Only JPG, PNG, and WebP images are allowed'), false);
        }

        // Validate file extension
        const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
        const ext = extname(file.originalname).toLowerCase();
        if (!allowedExts.includes(ext)) {
          return cb(new BadRequestException('Invalid file extension'), false);
        }

        cb(null, true);
      },
    }),
  )
  async create(
    @Body() dto: CreateRegistrationDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        validators: [
          new MaxFileSizeValidator({
            maxSize: 5 * 1024 * 1024,
            message: 'Payment screenshot must be less than 5MB',
          }),
        ],
      }),
    )
    file: MulterFile,
  ): Promise<{ success: boolean; message: string; status: string }> {
    // Check for duplicate registration by email
    const exists = await this.registrationService.existsByEmail(dto.email);

    if (exists) {
      throw new ConflictException({
        success: false,
        message: 'This email is already registered for an event',
      });
    }

    if (dto.paymentMode === 'online') {
      if (!dto.transactionId) {
        throw new BadRequestException({
          success: false,
          message: 'Transaction ID is required',
        });
      }
      // Check for duplicate transaction ID
      const transactionExists = await this.registrationService.existsByTransactionId(
        dto.transactionId,
      );

      if (transactionExists) {
        throw new ConflictException({
          success: false,
          message: 'This transaction ID is already used',
        });
      }

      // Validate screenshot is provided
      if (!file) {
        throw new BadRequestException({
          success: false,
          message: 'Payment screenshot is required',
        });
      }
    }

    const screenshotPath = file ? `/transactions/${file.filename}` : undefined;
    const registration = await this.registrationService.create(dto, screenshotPath);

    // Send confirmation email (async, non-blocking)
    this.sendConfirmationEmail(registration).catch((err) => {
      this.logger.error(`Failed to send confirmation email: ${err.message}`);
    });

    return {
      success: true,
      message:
        dto.paymentMode === 'cash'
          ? 'Registration successful! Please pay at the event venue to receive your pass.'
          : 'Registration successful! Payment verification in progress.',
      status: dto.paymentMode === 'cash' ? 'cash_payment_pending' : 'pending_verification',
    };
  }

  /**
   * Send registration confirmation email
   */
  private async sendConfirmationEmail(registration: Registration): Promise<void> {
    const emailSent =
      registration.paymentMode === 'cash'
        ? await this.mailService.sendCashRegistrationConfirmation({
            name: registration.name,
            email: registration.email,
            event: registration.event,
            college: registration.college,
          })
        : await this.mailService.sendRegistrationConfirmation({
            name: registration.name,
            email: registration.email,
            event: registration.event,
            transactionId: registration.transactionId || 'N/A',
            college: registration.college,
          });

    if (emailSent) {
      await this.registrationService.markConfirmationEmailSent(registration.id);
      this.logger.log(`Confirmation email sent for registration ${registration.id}`);
    }
  }

  /**
   * GET /api/register
   *
   * Get all registrations (for admin dashboard).
   */
  @Get()
  async findAll(): Promise<{ success: boolean; data: Registration[] }> {
    const registrations = await this.registrationService.findAll();
    return {
      success: true,
      data: registrations,
    };
  }

  /**
   * PATCH /api/register/:id
   *
   * Update a registration (admin only).
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRegistrationDto,
  ): Promise<{ success: boolean; data: Registration }> {
    const registration = await this.registrationService.update(id, dto);
    return {
      success: true,
      data: registration,
    };
  }

  /**
   * GET /api/register/screenshot/:id
   *
   * Get payment screenshot for a registration.
   */
  @Get('screenshot/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.MEMBER)
  async getScreenshot(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const registration = await this.registrationService.findOne(id);
    if (!registration) throw new NotFoundException('Registration not found');
    if (!registration.screenshotPath) throw new NotFoundException('No screenshot available');

    // Full path: /data/transactions/filename
    // registration.screenshotPath is stored as '/transactions/filename'
    // So we need to map /transactions/ -> /data/transactions/
    const filename = basename(registration.screenshotPath);
    const filePath = join('/data/transactions', filename);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Screenshot file not found');
    }

    const stream = createReadStream(filePath);
    res.set({
      'Content-Type': 'image/jpeg', // approximate, browser will detect
      'Content-Disposition': `inline; filename="${filename}"`,
    });
    stream.pipe(res);
  }

  /**
   * DELETE /api/register/:id
   *
   * Delete a registration (admin only).
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean; message: string }> {
    await this.registrationService.delete(id);
    return {
      success: true,
      message: 'Registration deleted successfully',
    };
  }
}
