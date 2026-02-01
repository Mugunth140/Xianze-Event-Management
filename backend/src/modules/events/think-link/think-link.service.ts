import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThinkLinkPresentation } from './think-link.entity';

@Injectable()
export class ThinkLinkService {
  constructor(
    @InjectRepository(ThinkLinkPresentation)
    private readonly presentationRepository: Repository<ThinkLinkPresentation>,
  ) {}

  /**
   * Create a new presentation
   */
  async create(
    name: string,
    filePath: string,
    totalSlides: number = 0,
  ): Promise<ThinkLinkPresentation> {
    const presentation = this.presentationRepository.create({
      name,
      filePath,
      totalSlides,
    });
    return this.presentationRepository.save(presentation);
  }

  /**
   * Find all presentations ordered by creation date
   */
  async findAll(): Promise<ThinkLinkPresentation[]> {
    return this.presentationRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find presentation by ID
   */
  async findById(id: number): Promise<ThinkLinkPresentation> {
    const presentation = await this.presentationRepository.findOne({
      where: { id },
    });
    if (!presentation) {
      throw new NotFoundException(`Presentation with ID ${id} not found`);
    }
    return presentation;
  }

  /**
   * Update presentation name
   */
  async updateName(id: number, name: string): Promise<ThinkLinkPresentation> {
    const presentation = await this.findById(id);
    presentation.name = name;
    return this.presentationRepository.save(presentation);
  }

  /**
   * Update total slides count
   */
  async updateTotalSlides(id: number, totalSlides: number): Promise<ThinkLinkPresentation> {
    const presentation = await this.findById(id);
    presentation.totalSlides = totalSlides;
    return this.presentationRepository.save(presentation);
  }

  /**
   * Delete presentation
   */
  async delete(id: number): Promise<void> {
    const presentation = await this.findById(id);
    await this.presentationRepository.remove(presentation);
  }

  /**
   * Get stats
   */
  async getStats(): Promise<{ total: number }> {
    const count = await this.presentationRepository.count();
    return { total: count };
  }
}
