import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PuzzleResult, ThinkLinkPuzzle } from './think-link.entity';

@Injectable()
export class ThinkLinkService {
  constructor(
    @InjectRepository(ThinkLinkPuzzle)
    private readonly puzzleRepository: Repository<ThinkLinkPuzzle>,
  ) {}

  /**
   * Create a new puzzle
   */
  async create(imagePath: string, hint?: string): Promise<ThinkLinkPuzzle> {
    // Get next round number
    const maxRound = await this.puzzleRepository
      .createQueryBuilder('puzzle')
      .select('MAX(puzzle.roundNumber)', 'max')
      .getRawOne();

    const nextRound = (maxRound?.max || 0) + 1;

    const puzzle = this.puzzleRepository.create({
      imagePath,
      hint: hint || null,
      roundNumber: nextRound,
      result: PuzzleResult.PENDING,
    });
    return this.puzzleRepository.save(puzzle);
  }

  /**
   * Find all puzzles ordered by round number
   */
  async findAll(): Promise<ThinkLinkPuzzle[]> {
    return this.puzzleRepository.find({
      order: { roundNumber: 'ASC' },
    });
  }

  /**
   * Find puzzle by ID
   */
  async findById(id: number): Promise<ThinkLinkPuzzle> {
    const puzzle = await this.puzzleRepository.findOne({ where: { id } });
    if (!puzzle) {
      throw new NotFoundException(`Puzzle with ID ${id} not found`);
    }
    return puzzle;
  }

  /**
   * Update puzzle hint
   */
  async updateHint(id: number, hint: string): Promise<ThinkLinkPuzzle> {
    const puzzle = await this.findById(id);
    puzzle.hint = hint;
    return this.puzzleRepository.save(puzzle);
  }

  /**
   * Mark puzzle result
   */
  async markResult(id: number, result: PuzzleResult): Promise<ThinkLinkPuzzle> {
    const puzzle = await this.findById(id);
    puzzle.result = result;
    puzzle.markedAt = new Date();
    return this.puzzleRepository.save(puzzle);
  }

  /**
   * Reorder puzzle
   */
  async reorder(id: number, newRoundNumber: number): Promise<ThinkLinkPuzzle> {
    const puzzle = await this.findById(id);
    puzzle.roundNumber = newRoundNumber;
    return this.puzzleRepository.save(puzzle);
  }

  /**
   * Reset all puzzles to pending
   */
  async resetAll(): Promise<void> {
    await this.puzzleRepository.update({}, { result: PuzzleResult.PENDING, markedAt: null });
  }

  /**
   * Delete puzzle
   */
  async delete(id: number): Promise<void> {
    const puzzle = await this.findById(id);
    await this.puzzleRepository.remove(puzzle);
  }

  /**
   * Get stats
   */
  async getStats(): Promise<{ total: number; correct: number; wrong: number; pending: number }> {
    const puzzles = await this.puzzleRepository.find();
    return {
      total: puzzles.length,
      correct: puzzles.filter((p) => p.result === PuzzleResult.CORRECT).length,
      wrong: puzzles.filter((p) => p.result === PuzzleResult.WRONG).length,
      pending: puzzles.filter((p) => p.result === PuzzleResult.PENDING).length,
    };
  }
}
