import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { MongoClient, Binary, ClientEncryption, ObjectId } from 'mongodb';
import { createEncryptionConfig } from './encryption.config';
import * as crypto from 'crypto';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class EncryptionService implements OnModuleInit {
  private readonly logger = new Logger(EncryptionService.name);
  private clientEncryption: ClientEncryption;
  private dataKey: Binary;
  private initialized = false;

  constructor(@InjectConnection() private connection: Connection) {}

  async onModuleInit() {
    try {
      await this.initialize();
      this.initialized = true;
      this.logger.log('Encryption service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize encryption service', error.stack);
      // Don't throw here to allow the application to start without encryption
      // The service methods will check this.initialized and throw if needed
    }
  }

  private async initialize() {
    // Get the native MongoDB connection from Mongoose
    const mongoClient = this.connection.getClient();

    // Generate a secure 96-byte master key
    const masterKey = crypto.randomBytes(96);
    
    const encryptionConfig = await createEncryptionConfig(masterKey);
    
    try {
      this.clientEncryption = new ClientEncryption(mongoClient, {
        keyVaultNamespace: encryptionConfig.keyVaultNamespace,
        kmsProviders: encryptionConfig.kmsProviders,
      });

      // Try to find an existing data key
      const keyVaultColl = this.connection.db.collection('encryption.__keyVault');
      const existingKey = await keyVaultColl.findOne({});
      
      if (existingKey) {
        const keyId = existingKey._id as ObjectId;
        const keyData = keyId.id;
        this.dataKey = new Binary(keyData, 4); // 4 is Binary.SUBTYPE_UUID
        this.logger.debug('Using existing encryption key');
      } else {
        // Create a new data key if none exists
        this.dataKey = await this.clientEncryption.createDataKey('local');
        this.logger.debug('Created new encryption key');
      }
    } catch (error) {
      this.logger.error('Error during encryption initialization:', error.stack);
      throw new Error('Failed to initialize encryption service: ' + error.message);
    }
  }

  async encryptField(value: string, algorithm: 'deterministic' | 'random' = 'deterministic'): Promise<Binary> {
    if (!this.initialized || !this.clientEncryption || !this.dataKey) {
      throw new Error('Encryption service not initialized. Please check the logs for initialization errors.');
    }

    try {
      const encryptedValue = await this.clientEncryption.encrypt(value, {
        algorithm: algorithm === 'deterministic' 
          ? 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic'
          : 'AEAD_AES_256_CBC_HMAC_SHA_512-Random',
        keyId: this.dataKey,
      });

      return encryptedValue;
    } catch (error) {
      this.logger.error(`Failed to encrypt field: ${error.message}`);
      throw new Error('Encryption failed');
    }
  }

  async decryptField(encryptedValue: Binary): Promise<string> {
    if (!this.initialized || !this.clientEncryption) {
      throw new Error('Encryption service not initialized. Please check the logs for initialization errors.');
    }

    try {
      const decryptedValue = await this.clientEncryption.decrypt(encryptedValue);
      if (typeof decryptedValue !== 'string') {
        throw new Error('Decrypted value is not a string');
      }
      
      return decryptedValue;
    } catch (error) {
      this.logger.error(`Failed to decrypt field: ${error.message}`);
      throw new Error('Decryption failed');
    }
  }
}
