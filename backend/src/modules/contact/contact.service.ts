import { Injectable, Logger } from '@nestjs/common';
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
}
