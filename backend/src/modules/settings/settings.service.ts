import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting, SETTING_KEYS, SettingKey } from './settings.entity';

// Default settings
const DEFAULT_SETTINGS: Record<SettingKey, { value: string; description: string }> = {
  [SETTING_KEYS.REGISTRATION_OPEN]: {
    value: 'true',
    description: 'Whether event registrations are currently open',
  },
  [SETTING_KEYS.REGISTRATION_CLOSED_MESSAGE]: {
    value: 'Registrations are currently closed. Please check back later.',
    description: 'Message shown when registrations are closed',
  },
  [SETTING_KEYS.ONLINE_PAYMENT_ENABLED]: {
    value: 'true',
    description: 'Whether online (UPI) payment option is available on the registration page',
  },
};

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(Setting)
    private readonly settingsRepo: Repository<Setting>,
  ) {}

  /**
   * Initialize default settings if they don't exist
   */
  async initializeDefaults(): Promise<void> {
    for (const [key, config] of Object.entries(DEFAULT_SETTINGS)) {
      const existing = await this.settingsRepo.findOne({ where: { key } });
      if (!existing) {
        const setting = this.settingsRepo.create({
          key,
          value: config.value,
          description: config.description,
        });
        await this.settingsRepo.save(setting);
        this.logger.log(`Initialized setting: ${key}`);
      }
    }
  }

  /**
   * Get a setting value by key
   */
  async get(key: SettingKey): Promise<string | null> {
    await this.initializeDefaults();
    const setting = await this.settingsRepo.findOne({ where: { key } });
    return setting?.value ?? null;
  }

  /**
   * Get a boolean setting
   */
  async getBoolean(key: SettingKey): Promise<boolean> {
    const value = await this.get(key);
    return value === 'true';
  }

  /**
   * Set a setting value
   */
  async set(key: SettingKey, value: string): Promise<Setting> {
    await this.initializeDefaults();
    let setting = await this.settingsRepo.findOne({ where: { key } });

    if (!setting) {
      setting = this.settingsRepo.create({ key, value });
    } else {
      setting.value = value;
    }

    return this.settingsRepo.save(setting);
  }

  /**
   * Get all settings
   */
  async getAll(): Promise<Setting[]> {
    await this.initializeDefaults();
    return this.settingsRepo.find({ order: { key: 'ASC' } });
  }

  /**
   * Check if registrations are open
   */
  async isRegistrationOpen(): Promise<boolean> {
    return this.getBoolean(SETTING_KEYS.REGISTRATION_OPEN);
  }

  /**
   * Get registration status with message
   */
  async getRegistrationStatus(): Promise<{
    isOpen: boolean;
    message: string | null;
  }> {
    const isOpen = await this.getBoolean(SETTING_KEYS.REGISTRATION_OPEN);
    const message = isOpen ? null : await this.get(SETTING_KEYS.REGISTRATION_CLOSED_MESSAGE);
    return { isOpen, message };
  }

  /**
   * Toggle registration status
   */
  async toggleRegistration(isOpen: boolean): Promise<{ isOpen: boolean }> {
    await this.set(SETTING_KEYS.REGISTRATION_OPEN, isOpen ? 'true' : 'false');
    this.logger.log(`Registrations ${isOpen ? 'opened' : 'closed'}`);
    return { isOpen };
  }

  /**
   * Update registration closed message
   */
  async setRegistrationClosedMessage(message: string): Promise<Setting> {
    return this.set(SETTING_KEYS.REGISTRATION_CLOSED_MESSAGE, message);
  }

  /**
   * Check if online payment is enabled
   */
  async isOnlinePaymentEnabled(): Promise<boolean> {
    return this.getBoolean(SETTING_KEYS.ONLINE_PAYMENT_ENABLED);
  }

  /**
   * Toggle online payment availability
   */
  async toggleOnlinePayment(enabled: boolean): Promise<{ enabled: boolean }> {
    await this.set(SETTING_KEYS.ONLINE_PAYMENT_ENABLED, enabled ? 'true' : 'false');
    this.logger.log(`Online payment ${enabled ? 'enabled' : 'disabled'}`);
    return { enabled };
  }
}
