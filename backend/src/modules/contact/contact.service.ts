import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { Contact } from './contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    private readonly mailService: MailService,
  ) {}

  async create(dto: CreateContactDto): Promise<Contact> {
    const contact = this.contactRepository.create(dto);
    const savedContact = await this.contactRepository.save(contact);

    // Send auto-reply asynchronously
    this.mailService.sendContactAutoReply(savedContact.email, savedContact.name).catch((err) => {
      this.logger.error(`Failed to send auto-reply to ${savedContact.email}`, err.stack);
    });

    return savedContact;
  }

  async findAll(): Promise<Contact[]> {
    return this.contactRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async delete(id: number): Promise<void> {
    const contact = await this.contactRepository.findOne({ where: { id } });

    if (!contact) {
      throw new NotFoundException('Contact inquiry not found');
    }

    await this.contactRepository.remove(contact);
  }

  async replyToInquiry(id: number, message: string): Promise<void> {
    const contact = await this.contactRepository.findOne({ where: { id } });

    if (!contact) {
      throw new NotFoundException('Contact inquiry not found');
    }

    // Send reply from contact@xianze.tech
    await this.mailService.sendContactReply(contact.email, contact.name, contact.message, message);

    this.logger.log(`Reply sent to ${contact.email} for inquiry #${id}`);
  }
}
