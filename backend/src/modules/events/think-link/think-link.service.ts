import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { ThinkLinkPresentation } from './think-link.entity';

@Injectable()
export class ThinkLinkService {
  constructor(
    @InjectRepository(ThinkLinkPresentation)
    private readonly presentationRepository: Repository<ThinkLinkPresentation>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
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
    const saved = await this.presentationRepository.save(presentation);
    await this.cacheManager.del('think-link:presentations:all');
    return saved;
  }

  /**
   * Find all presentations ordered by creation date
   */
  async findAll(): Promise<ThinkLinkPresentation[]> {
    const cacheKey = 'think-link:presentations:all';
    const cached = await this.cacheManager.get<ThinkLinkPresentation[]>(cacheKey);
    if (cached) {
      return cached;
    }
    const presentations = await this.presentationRepository.find({
      order: { createdAt: 'DESC' },
    });
    await this.cacheManager.set(cacheKey, presentations, 300);
    return presentations;
  }

  /**
   * Find presentation by ID
   */
  async findById(id: number): Promise<ThinkLinkPresentation> {
    const cacheKey = `think-link:presentation:${id}`;
    const cached = await this.cacheManager.get<ThinkLinkPresentation>(cacheKey);
    if (cached) {
      return cached;
    }
    const presentation = await this.presentationRepository.findOne({
      where: { id },
    });
    if (!presentation) {
      throw new NotFoundException(`Presentation with ID ${id} not found`);
    }
    await this.cacheManager.set(cacheKey, presentation, 300);
    return presentation;
  }

  /**
   * Update presentation name
   */
  async updateName(id: number, name: string): Promise<ThinkLinkPresentation> {
    const presentation = await this.findById(id);
    presentation.name = name;
    const saved = await this.presentationRepository.save(presentation);
    await Promise.all([
      this.cacheManager.del('think-link:presentations:all'),
      this.cacheManager.del(`think-link:presentation:${id}`),
    ]);
    return saved;
  }

  /**
   * Update total slides count
   */
  async updateTotalSlides(id: number, totalSlides: number): Promise<ThinkLinkPresentation> {
    const presentation = await this.findById(id);
    presentation.totalSlides = totalSlides;
    const saved = await this.presentationRepository.save(presentation);
    await Promise.all([
      this.cacheManager.del('think-link:presentations:all'),
      this.cacheManager.del(`think-link:presentation:${id}`),
    ]);
    return saved;
  }

  /**
   * Delete presentation
   */
  async delete(id: number): Promise<void> {
    const presentation = await this.findById(id);
    await this.presentationRepository.remove(presentation);
    await Promise.all([
      this.cacheManager.del('think-link:presentations:all'),
      this.cacheManager.del(`think-link:presentation:${id}`),
    ]);
  }

  /**
   * Get stats
   */
  async getStats(): Promise<{ total: number }> {
    const count = await this.presentationRepository.count();
    return { total: count };
  }
}
