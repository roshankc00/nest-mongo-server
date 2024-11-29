import { Binary } from 'mongodb';

export interface EncryptionConfig {
  keyVaultNamespace: string;
  kmsProviders: {
    local: {
      key: Binary;
    };
  };
  schemaMap: {
    [key: string]: any;
  };
}

export const createEncryptionConfig = async (masterKey: Buffer): Promise<EncryptionConfig> => {
  return {
    keyVaultNamespace: 'encryption.__keyVault',
    kmsProviders: {
      local: {
        key: new Binary(masterKey),
      },
    },
    schemaMap: {
      'mydatabase.users': {
        bsonType: 'object',
        encryptMetadata: {
          keyId: [],
        },
        properties: {
          ssn: {
            encrypt: {
              bsonType: 'string',
              algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic',
            },
          },
          creditCardNumber: {
            encrypt: {
              bsonType: 'string',
              algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random',
            },
          },
        },
      },
    },
  };
};
