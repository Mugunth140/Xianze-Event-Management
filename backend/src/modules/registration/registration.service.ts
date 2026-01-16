import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { Registration } from './registration.entity';

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
   * Find registrations by email
   */
  async findByEmail(email: string): Promise<Registration[]> {
    return this.registrationRepository.find({
      where: { email },
    });
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
}
