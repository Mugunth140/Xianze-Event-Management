import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { PaymentStatus, Registration } from './registration.entity';

@Injectable()
export class RegistrationService {
  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
  ) {}

  /**
   * Create a new registration
   */
  async create(dto: CreateRegistrationDto): Promise<Registration> {
    const registration = this.registrationRepository.create(dto);
    return this.registrationRepository.save(registration);
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
   * Check if a registration already exists for the given email
   */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.registrationRepository.count({
      where: { email },
    });
    return count > 0;
  }

  // ==========================================
  // Payment Verification Methods
  // ==========================================

  /**
   * Get pending payments (optionally filtered by event)
   */
  async getPendingPayments(event?: string): Promise<Registration[]> {
    const query: Record<string, unknown> = { paymentStatus: PaymentStatus.PENDING };
    if (event) {
      query.event = event;
    }
    return this.registrationRepository.find({
      where: query,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Verify a payment
   */
  async verifyPayment(id: number, userId: number, note?: string): Promise<Registration> {
    const reg = await this.findOne(id);
    reg.paymentStatus = PaymentStatus.VERIFIED;
    reg.verifiedBy = userId;
    reg.verifiedAt = new Date();
    reg.verificationNote = note || null;
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
