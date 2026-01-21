import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { randomBytes } from 'crypto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { MailService } from '../mail/mail.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
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
        filename: (_req: any, file: any, cb: any) => {
          cb(null, generateSecureFilename(file.originalname));
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
      },
      fileFilter: (_req: any, file: any, cb: any) => {
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
        fileIsRequired: true,
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
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

    // Validate screenshot is provided
    if (!file) {
      throw new BadRequestException({
        success: false,
        message: 'Payment screenshot is required',
      });
    }

    const screenshotPath = `/transactions/${file.filename}`;
    const registration = await this.registrationService.create(dto, screenshotPath);

    // Send confirmation email (async, non-blocking)
    this.sendConfirmationEmail(registration).catch((err) => {
      this.logger.error(`Failed to send confirmation email: ${err.message}`);
    });

    return {
      success: true,
      message: 'Registration successful! Payment verification in progress.',
      status: 'pending_verification',
    };
  }

  /**
   * Send registration confirmation email
   */
  private async sendConfirmationEmail(registration: Registration): Promise<void> {
    const emailSent = await this.mailService.sendRegistrationConfirmation({
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
}
