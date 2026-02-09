import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { PaymentMode, PaymentStatus, Registration } from './registration.entity';
import { generatePassId, hashEmailForQR } from './utils/hash.util';

@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
  ) {}

  /**
   * Create a new registration
   */
  async create(dto: CreateRegistrationDto, screenshotPath?: string | null): Promise<Registration> {
    const registration = this.registrationRepository.create({
      name: dto.name,
      email: dto.email,
      course: dto.course,
      branch: dto.branch,
      college: dto.college,
      contact: dto.contact,
      event: dto.event,
      paymentMode: dto.paymentMode === 'cash' ? PaymentMode.CASH : PaymentMode.ONLINE,
      transactionId: dto.paymentMode === 'cash' ? null : (dto.transactionId ?? null),
      screenshotPath: dto.paymentMode === 'cash' ? null : (screenshotPath ?? null),
    });
    return this.registrationRepository.save(registration);
  }

  /**
   * Mark confirmation email as sent
   */
  async markConfirmationEmailSent(id: number): Promise<Registration> {
    const reg = await this.findOne(id);
    reg.confirmationEmailSent = true;
    reg.confirmationEmailSentAt = new Date();
    return this.registrationRepository.save(reg);
  }

  /**
   * Find all registrations (for admin dashboard)
   */
  async findAll(): Promise<Registration[]> {
    return this.registrationRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find registrations by event (for scoped access)
   */
  async findByEvent(event: string): Promise<Registration[]> {
    return this.registrationRepository.find({
      where: { event },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find registrations by email
   */
  async findByEmail(email: string): Promise<Registration[]> {
    return this.registrationRepository.find({
      where: { email },
    });
  }

  /**
   * Find one registration by ID
   */
  async findOne(id: number): Promise<Registration> {
    const reg = await this.registrationRepository.findOne({ where: { id } });
    if (!reg) {
      throw new NotFoundException('Registration not found');
    }
    return reg;
  }

  /**
   * Find registration by pass ID (for check-in)
   */
  async findByPassId(passId: string): Promise<Registration | null> {
    return this.registrationRepository.findOne({ where: { passId } });
  }

  /**
   * Find registration by QR hash (for check-in validation)
   */
  async findByQRHash(qrHash: string): Promise<Registration | null> {
    return this.registrationRepository.findOne({ where: { qrCodeHash: qrHash } });
  }

  /**
   * Check if a registration already exists for the given email
   */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.registrationRepository.count({
      where: { email },
    });
    return count > 0;
  }

  /**
   * Check if a registration already exists for the given transaction ID
   */
  async existsByTransactionId(transactionId: string): Promise<boolean> {
    const count = await this.registrationRepository.count({
      where: { transactionId },
    });
    return count > 0;
  }

  // ==========================================
  // Admin CRUD Methods
  // ==========================================

  /**
   * Update a registration (admin only)
   */
  async update(id: number, dto: UpdateRegistrationDto): Promise<Registration> {
    const registration = await this.findOne(id);

    // If email is being changed, check for duplicates
    if (dto.email && dto.email !== registration.email) {
      const emailExists = await this.existsByEmail(dto.email);
      if (emailExists) {
        throw new ConflictException('Email already registered');
      }
    }

    // If transaction ID is being changed, check for duplicates
    if (dto.transactionId && dto.transactionId !== registration.transactionId) {
      const transactionExists = await this.existsByTransactionId(dto.transactionId);
      if (transactionExists) {
        throw new ConflictException('Transaction ID already used');
      }
    }

    if (dto.paymentMode === 'cash') {
      dto.transactionId = undefined;
      registration.transactionId = null;
      registration.screenshotPath = null;
    }

    // Update fields
    Object.assign(registration, dto);

    this.logger.log(`Registration ${id} updated`);
    return this.registrationRepository.save(registration);
  }

  /**
   * Delete a registration (admin only)
   */
  async delete(id: number): Promise<void> {
    const registration = await this.findOne(id);
    await this.registrationRepository.remove(registration);
    this.logger.log(`Registration ${id} deleted`);
  }

  // ==========================================
  // Payment Verification Methods
  // ==========================================

  /**
   * Get pending payments (optionally filtered by event)
   */
  async getPendingPayments(event?: string): Promise<Registration[]> {
    const query: Record<string, unknown> = {
      paymentStatus: PaymentStatus.PENDING,
    };
    if (event) {
      query.event = event;
    }
    return this.registrationRepository.find({
      where: query,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Verify a payment and generate event pass
   */
  async verifyPayment(id: number, userId: number, note?: string): Promise<Registration> {
    const reg = await this.findOne(id);

    // Generate pass ID and QR hash
    const passId = generatePassId();
    const qrCodeHash = hashEmailForQR(reg.email, reg.id);

    reg.paymentStatus = PaymentStatus.VERIFIED;
    reg.verifiedBy = userId;
    reg.verifiedAt = new Date();
    reg.verificationNote = note || null;
    reg.passId = passId;
    reg.qrCodeHash = qrCodeHash;

    this.logger.log(`Payment verified for registration ${id}, pass ID: ${passId}`);

    return this.registrationRepository.save(reg);
  }

  /**
   * Mark pass email as sent
   */
  async markPassEmailSent(id: number): Promise<Registration> {
    const reg = await this.findOne(id);
    reg.passEmailSent = true;
    reg.passEmailSentAt = new Date();
    return this.registrationRepository.save(reg);
  }

  /**
   * Reject a payment
   */
  async rejectPayment(id: number, userId: number, reason: string): Promise<Registration> {
    const reg = await this.findOne(id);
    reg.paymentStatus = PaymentStatus.REJECTED;
    reg.verifiedBy = userId;
    reg.verifiedAt = new Date();
    reg.verificationNote = reason;
    return this.registrationRepository.save(reg);
  }

  // ==========================================
  // Check-in / Attendance Methods
  // ==========================================

  /**
   * Check in a participant
   */
  async checkIn(id: number, userId: number): Promise<Registration> {
    const reg = await this.findOne(id);
    reg.isCheckedIn = true;
    reg.checkedInBy = userId;
    reg.checkedInAt = new Date();
    return this.registrationRepository.save(reg);
  }

  /**
   * Check in by QR hash
   */
  async checkInByQRHash(qrHash: string, userId: number): Promise<Registration> {
    const reg = await this.findByQRHash(qrHash);
    if (!reg) {
      throw new NotFoundException('Invalid QR code');
    }

    if (reg.isCheckedIn) {
      throw new Error('Already checked in');
    }

    if (reg.paymentStatus !== PaymentStatus.VERIFIED) {
      throw new Error('Payment not verified');
    }

    reg.isCheckedIn = true;
    reg.checkedInBy = userId;
    reg.checkedInAt = new Date();
    return this.registrationRepository.save(reg);
  }

  /**
   * Get attendance for an event
   */
  async getAttendance(event: string): Promise<Registration[]> {
    return this.registrationRepository.find({
      where: { event, isCheckedIn: true },
      order: { checkedInAt: 'DESC' },
    });
  }

  /**
   * Get attendance stats for an event
   */
  async getAttendanceStats(event?: string): Promise<{
    total: number;
    checkedIn: number;
    pending: number;
  }> {
    const query: Record<string, unknown> = {};
    if (event) {
      query.event = event;
    }

    const total = await this.registrationRepository.count({ where: query });
    const checkedIn = await this.registrationRepository.count({
      where: { ...query, isCheckedIn: true },
    });

    return {
      total,
      checkedIn,
      pending: total - checkedIn,
    };
  }

  /**
   * Validate registration for check-in by QR hash
   */
  async validateForCheckInByQR(qrHash: string): Promise<{
    valid: boolean;
    registration?: Registration;
    reason?: string;
  }> {
    const reg = await this.findByQRHash(qrHash);

    if (!reg) {
      return { valid: false, reason: 'Invalid QR code' };
    }

    if (reg.isCheckedIn) {
      return {
        valid: false,
        registration: reg,
        reason: 'Already checked in',
      };
    }

    if (reg.paymentStatus !== PaymentStatus.VERIFIED) {
      return {
        valid: false,
        registration: reg,
        reason: `Payment ${reg.paymentStatus}`,
      };
    }

    return { valid: true, registration: reg };
  }

  /**
   * Find registration by ID for QR scan validation
   */
  async validateForCheckIn(id: number): Promise<{
    valid: boolean;
    registration?: Registration;
    reason?: string;
  }> {
    try {
      const reg = await this.findOne(id);

      // Check if already checked in
      if (reg.isCheckedIn) {
        return {
          valid: false,
          registration: reg,
          reason: 'Already checked in',
        };
      }

      // Check if payment is verified
      if (reg.paymentStatus !== PaymentStatus.VERIFIED) {
        return {
          valid: false,
          registration: reg,
          reason: `Payment ${reg.paymentStatus}`,
        };
      }

      return { valid: true, registration: reg };
    } catch {
      return { valid: false, reason: 'Registration not found' };
    }
  }
}
