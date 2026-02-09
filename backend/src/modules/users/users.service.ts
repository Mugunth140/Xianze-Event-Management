import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const existing = await this.userRepository.findOne({
      where: { username: dto.username },
    });

    if (existing) {
      throw new ConflictException('Username already exists');
    }

    if (dto.role === UserRole.COORDINATOR && !dto.assignedEvent) {
      throw new BadRequestException('Assigned event is required for coordinators');
    }

    if (dto.role === UserRole.MEMBER && (!dto.assignedEvents || dto.assignedEvents.length === 0)) {
      throw new BadRequestException('At least one assigned event is required for members');
    }

    if (dto.role === UserRole.MEMBER && dto.assignedEvents && dto.assignedEvents.length > 1) {
      throw new BadRequestException('Members can only be assigned to one event');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });

    const saved = await this.userRepository.save(user);
    const { password: _password, ...result } = saved;
    return result;
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
    return users.map(({ password: _password, ...user }) => user);
  }

  async findOne(id: number): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { password: _password, ...result } = user;
    return result;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async update(id: number, dto: UpdateUserDto): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const nextRole = dto.role ?? user.role;
    const nextAssignedEvent = dto.assignedEvent ?? user.assignedEvent;
    const nextAssignedEvents = dto.assignedEvents ?? user.assignedEvents;

    if (nextRole === UserRole.COORDINATOR && !nextAssignedEvent) {
      throw new BadRequestException('Assigned event is required for coordinators');
    }

    if (nextRole === UserRole.MEMBER && (!nextAssignedEvents || nextAssignedEvents.length === 0)) {
      throw new BadRequestException('At least one assigned event is required for members');
    }

    if (nextRole === UserRole.MEMBER && nextAssignedEvents && nextAssignedEvents.length > 1) {
      throw new BadRequestException('Members can only be assigned to one event');
    }

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    Object.assign(user, dto);
    const saved = await this.userRepository.save(user);
    const { password: _password, ...result } = saved;
    return result;
  }

  async remove(id: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userRepository.remove(user);
  }

  async seedAdmin(): Promise<void> {
    const adminExists = await this.userRepository.findOne({
      where: { username: 'admin' },
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('Xianze@2026', 10);
      await this.userRepository.save({
        username: 'admin',
        password: hashedPassword,
        name: 'Administrator',
        role: UserRole.ADMIN,
        assignedEvent: null,
      });
      // eslint-disable-next-line no-console
      console.log('✅ Default admin user created');
    }
  }
}
