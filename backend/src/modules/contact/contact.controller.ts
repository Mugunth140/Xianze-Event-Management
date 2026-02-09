import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/user.entity';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { ReplyContactDto } from './dto/reply-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  /**
   * POST /api/contact
   *
   * Submit a contact form message.
   * Rate limit: 3 requests per minute per IP to prevent spam
   */
  @Post()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateContactDto) {
    const contact = await this.contactService.create(dto);

    return {
      success: true,
      message: 'Message sent successfully',
      data: contact,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll() {
    const contacts = await this.contactService.findAll();
    return {
      success: true,
      data: contacts,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.contactService.delete(id);
    return {
      success: true,
      message: 'Inquiry deleted successfully',
    };
  }

  /**
   * POST /api/contact/:id/reply
   *
   * Send reply to a contact inquiry from contact@xianze.tech
   * Only coordinators and admins can reply
   */
  @Post(':id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COORDINATOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async reply(@Param('id', ParseIntPipe) id: number, @Body() dto: ReplyContactDto) {
    await this.contactService.replyToInquiry(id, dto.message);
    return {
      success: true,
      message: 'Reply sent successfully',
    };
  }
}
