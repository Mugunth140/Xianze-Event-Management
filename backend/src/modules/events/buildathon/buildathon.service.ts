import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Repository } from 'typeorm';
import { CreateTeamDto, UpdateApiStateDto, UpdateTeamDto, UploadDocumentDto } from './buildathon.dto';
import {
    BuildathonApiState,
    BuildathonDocument,
    BuildathonRequestLog,
    BuildathonTeam,
} from './buildathon.entity';

// Load JSON data
const dataDir = path.join(__dirname, 'data');
const customersData = JSON.parse(fs.readFileSync(path.join(dataDir, 'customers.json'), 'utf-8'));
const ordersData = JSON.parse(fs.readFileSync(path.join(dataDir, 'orders.json'), 'utf-8'));
const productsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf-8'));

@Injectable()
export class BuildathonService {
  constructor(
    @InjectRepository(BuildathonTeam)
    private readonly teamRepo: Repository<BuildathonTeam>,
    @InjectRepository(BuildathonDocument)
    private readonly documentRepo: Repository<BuildathonDocument>,
    @InjectRepository(BuildathonApiState)
    private readonly apiStateRepo: Repository<BuildathonApiState>,
    @InjectRepository(BuildathonRequestLog)
    private readonly requestLogRepo: Repository<BuildathonRequestLog>,
  ) {}

  // ========================
  // TEAM MANAGEMENT
  // ========================

  async createTeam(dto: CreateTeamDto): Promise<BuildathonTeam> {
    const existing = await this.teamRepo.findOne({ where: { teamName: dto.teamName } });
    if (existing) {
      throw new BadRequestException('Team name already exists');
    }

    const team = this.teamRepo.create(dto);
    return this.teamRepo.save(team);
  }

  async getAllTeams(): Promise<BuildathonTeam[]> {
    return this.teamRepo.find({ order: { createdAt: 'DESC' } });
  }

  async getTeamById(id: number): Promise<BuildathonTeam> {
    const team = await this.teamRepo.findOne({ where: { id } });
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    return team;
  }

  async updateTeam(id: number, dto: UpdateTeamDto): Promise<BuildathonTeam> {
    const team = await this.getTeamById(id);

    if (dto.teamName && dto.teamName !== team.teamName) {
      const existing = await this.teamRepo.findOne({ where: { teamName: dto.teamName } });
      if (existing) {
        throw new BadRequestException('Team name already exists');
      }
      team.teamName = dto.teamName;
    }

    if (dto.participant1 !== undefined) team.participant1 = dto.participant1;
    if (dto.participant2 !== undefined) team.participant2 = dto.participant2;
    if (dto.participant3 !== undefined) team.participant3 = dto.participant3;
    if (dto.participant4 !== undefined) team.participant4 = dto.participant4;
    if (dto.email !== undefined) team.email = dto.email;
    if (dto.phone !== undefined) team.phone = dto.phone;

    return this.teamRepo.save(team);
  }

  async deleteTeam(id: number): Promise<void> {
    const result = await this.teamRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Team not found');
    }
  }

  // ========================
  // DOCUMENT MANAGEMENT
  // ========================

  async createDocument(dto: UploadDocumentDto, filePath: string): Promise<BuildathonDocument> {
    const existingDocs = await this.documentRepo.find();
    for (const existing of existingDocs) {
      if (existing.filePath && fs.existsSync(existing.filePath)) {
        fs.unlinkSync(existing.filePath);
      }
      if (existing.qrCodePath && fs.existsSync(existing.qrCodePath)) {
        fs.unlinkSync(existing.qrCodePath);
      }
    }
    if (existingDocs.length > 0) {
      await this.documentRepo.remove(existingDocs);
    }

    const doc = this.documentRepo.create({
      title: dto.title,
      description: dto.description,
      filePath,
      isActive: true,
    });
    return this.documentRepo.save(doc);
  }

  async updateDocumentQr(id: number, qrCodePath: string): Promise<BuildathonDocument> {
    const doc = await this.documentRepo.findOne({ where: { id } });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    doc.qrCodePath = qrCodePath;
    return this.documentRepo.save(doc);
  }

  async getAllDocuments(): Promise<BuildathonDocument[]> {
    return this.documentRepo.find({ order: { createdAt: 'DESC' } });
  }

  async getActiveDocument(): Promise<BuildathonDocument | null> {
    return this.documentRepo.findOne({ where: { isActive: true }, order: { createdAt: 'DESC' } });
  }

  async setActiveDocument(id: number): Promise<BuildathonDocument> {
    // Deactivate all
    await this.documentRepo.update({}, { isActive: false });
    // Activate this one
    const doc = await this.documentRepo.findOne({ where: { id } });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    doc.isActive = true;
    return this.documentRepo.save(doc);
  }

  async deleteDocument(id: number): Promise<void> {
    const doc = await this.documentRepo.findOne({ where: { id } });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    // Delete file if exists
    if (doc.filePath && fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }
    if (doc.qrCodePath && fs.existsSync(doc.qrCodePath)) {
      fs.unlinkSync(doc.qrCodePath);
    }
    await this.documentRepo.delete(id);
  }

  // ========================
  // API STATE MANAGEMENT
  // ========================

  async getApiState(): Promise<BuildathonApiState> {
    let state = await this.apiStateRepo.findOne({ where: {} });
    if (!state) {
      // Create default state
      state = this.apiStateRepo.create({
        customersEndpointEnabled: false,
        ordersEndpointEnabled: false,
        productsEndpointEnabled: false,
      });
      state = await this.apiStateRepo.save(state);
    }
    return state;
  }

  async updateApiState(dto: UpdateApiStateDto): Promise<BuildathonApiState> {
    const state = await this.getApiState();
    if (dto.customersEndpointEnabled !== undefined) {
      state.customersEndpointEnabled = dto.customersEndpointEnabled;
    }
    if (dto.ordersEndpointEnabled !== undefined) {
      state.ordersEndpointEnabled = dto.ordersEndpointEnabled;
    }
    if (dto.productsEndpointEnabled !== undefined) {
      state.productsEndpointEnabled = dto.productsEndpointEnabled;
    }
    return this.apiStateRepo.save(state);
  }

  async updateRegistrationQr(qrPath: string): Promise<BuildathonApiState> {
    const state = await this.getApiState();
    state.registrationQrPath = qrPath;
    return this.apiStateRepo.save(state);
  }

  // ========================
  // DATA ENDPOINTS
  // ========================

  async getCustomers(ip?: string, userAgent?: string): Promise<unknown[]> {
    const state = await this.getApiState();
    if (!state.customersEndpointEnabled) {
      throw new BadRequestException('Customers endpoint is currently disabled');
    }
    // Log request
    await this.logRequest('customers', ip, userAgent);
    return customersData;
  }

  async getOrders(ip?: string, userAgent?: string): Promise<unknown[]> {
    const state = await this.getApiState();
    if (!state.ordersEndpointEnabled) {
      throw new BadRequestException('Orders endpoint is currently disabled');
    }
    await this.logRequest('orders', ip, userAgent);
    return ordersData;
  }

  async getProducts(ip?: string, userAgent?: string): Promise<unknown[]> {
    const state = await this.getApiState();
    if (!state.productsEndpointEnabled) {
      throw new BadRequestException('Products endpoint is currently disabled');
    }
    await this.logRequest('products', ip, userAgent);
    return productsData;
  }

  // ========================
  // REQUEST LOGGING & METRICS
  // ========================

  async logRequest(
    endpoint: string,
    ip?: string,
    userAgent?: string,
    teamId?: number,
  ): Promise<void> {
    const log = this.requestLogRepo.create({
      endpoint,
      ipAddress: ip,
      userAgent,
      teamId,
    });
    await this.requestLogRepo.save(log);
  }

  async getMetrics(): Promise<{
    totalRequests: number;
    requestsByEndpoint: { endpoint: string; count: number }[];
    recentRequests: BuildathonRequestLog[];
    requestsPerMinute: { minute: string; count: number }[];
  }> {
    const totalRequests = await this.requestLogRepo.count();

    // Requests by endpoint
    const byEndpoint = await this.requestLogRepo
      .createQueryBuilder('log')
      .select('log.endpoint', 'endpoint')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.endpoint')
      .getRawMany();

    // Recent requests (last 50)
    const recentRequests = await this.requestLogRepo.find({
      order: { createdAt: 'DESC' },
      take: 50,
    });

    // Requests per minute (last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const perMinute = await this.requestLogRepo
      .createQueryBuilder('log')
      .select("strftime('%Y-%m-%d %H:%M', log.createdAt)", 'minute')
      .addSelect('COUNT(*)', 'count')
      .where('log.createdAt >= :since', { since: thirtyMinutesAgo.toISOString() })
      .groupBy('minute')
      .orderBy('minute', 'ASC')
      .getRawMany();

    return {
      totalRequests,
      requestsByEndpoint: byEndpoint.map((r) => ({
        endpoint: r.endpoint,
        count: parseInt(r.count, 10),
      })),
      recentRequests,
      requestsPerMinute: perMinute.map((r) => ({
        minute: r.minute,
        count: parseInt(r.count, 10),
      })),
    };
  }

  async resetMetrics(): Promise<void> {
    await this.requestLogRepo.clear();
  }

  async getStats(): Promise<{
    totalTeams: number;
    totalDocuments: number;
    totalRequests: number;
    apiState: BuildathonApiState;
  }> {
    const [totalTeams, totalDocuments, totalRequests, apiState] = await Promise.all([
      this.teamRepo.count(),
      this.documentRepo.count(),
      this.requestLogRepo.count(),
      this.getApiState(),
    ]);

    return { totalTeams, totalDocuments, totalRequests, apiState };
  }
}
