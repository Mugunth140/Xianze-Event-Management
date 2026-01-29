import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { createReadStream, existsSync, unlinkSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../users/user.entity';
import { PuzzleResult } from './think-link.entity';
import { ThinkLinkService } from './think-link.service';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

// Generate secure filename
const generateFilename = (originalname: string): string => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 10);
  const ext = extname(originalname).toLowerCase();
  return `puzzle-${timestamp}-${randomStr}${ext}`;
};

@Controller('think-link')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ThinkLinkController {
  constructor(private readonly service: ThinkLinkService) {}

  /**
   * POST /api/think-link/puzzles
   * Upload a new puzzle image
   */
  @Post('puzzles')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: '/data/think-link',
        filename: (
          _req: Request,
          file: MulterFile,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          cb(null, generateFilename(file.originalname));
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (
        _req: Request,
        file: MulterFile,
        cb: (error: Error | null, acceptFile: boolean) => void,
      ) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimes.includes(file.mimetype)) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadPuzzle(@UploadedFile() file: MulterFile, @Body('hint') hint?: string) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const imagePath = `/think-link/${file.filename}`;
    const puzzle = await this.service.create(imagePath, hint);
    return { success: true, data: puzzle };
  }

  /**
   * GET /api/think-link/puzzles
   * List all puzzles
   */
  @Get('puzzles')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.MEMBER)
  async findAll() {
    const puzzles = await this.service.findAll();
    return { success: true, data: puzzles };
  }

  /**
   * GET /api/think-link/stats
   * Get puzzle statistics
   */
  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async getStats() {
    const stats = await this.service.getStats();
    return { success: true, data: stats };
  }

  /**
   * GET /api/think-link/puzzles/:id/image
   * Serve puzzle image
   */
  @Get('puzzles/:id/image')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.MEMBER)
  async getImage(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const puzzle = await this.service.findById(id);
    const filePath = join('/data', puzzle.imagePath);

    if (!existsSync(filePath)) {
      throw new BadRequestException('Image not found');
    }

    // Determine content type
    const ext = extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };

    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    const stream = createReadStream(filePath);
    stream.pipe(res);
  }

  /**
   * PATCH /api/think-link/puzzles/:id/hint
   * Update puzzle hint
   */
  @Patch('puzzles/:id/hint')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async updateHint(@Param('id', ParseIntPipe) id: number, @Body('hint') hint: string) {
    const puzzle = await this.service.updateHint(id, hint);
    return { success: true, data: puzzle };
  }

  /**
   * PATCH /api/think-link/puzzles/:id/result
   * Mark puzzle result (correct/wrong)
   */
  @Patch('puzzles/:id/result')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async markResult(@Param('id', ParseIntPipe) id: number, @Body('result') result: PuzzleResult) {
    if (!Object.values(PuzzleResult).includes(result)) {
      throw new BadRequestException('Invalid result. Must be: pending, correct, or wrong');
    }

    const puzzle = await this.service.markResult(id, result);
    return { success: true, data: puzzle };
  }

  /**
   * PATCH /api/think-link/puzzles/:id/order
   * Reorder puzzle
   */
  @Patch('puzzles/:id/order')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  async reorder(@Param('id', ParseIntPipe) id: number, @Body('roundNumber') roundNumber: number) {
    if (typeof roundNumber !== 'number' || roundNumber < 1) {
      throw new BadRequestException('roundNumber must be a positive number');
    }

    const puzzle = await this.service.reorder(id, roundNumber);
    return { success: true, data: puzzle };
  }

  /**
   * POST /api/think-link/reset
   * Reset all puzzles to pending
   */
  @Post('reset')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  @HttpCode(HttpStatus.OK)
  async resetAll() {
    await this.service.resetAll();
    return { success: true, message: 'All puzzles reset to pending' };
  }

  /**
   * DELETE /api/think-link/puzzles/:id
   * Delete a puzzle
   */
  @Delete('puzzles/:id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id', ParseIntPipe) id: number) {
    const puzzle = await this.service.findById(id);

    // Delete image file
    const filePath = join('/data', puzzle.imagePath);
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
      } catch {
        /* ignore */
      }
    }

    await this.service.delete(id);
    return { success: true, message: 'Puzzle deleted' };
  }
}
