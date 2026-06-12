import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;    // GCM recommended nonce length
const TAG_LENGTH = 16;   // GCM authentication tag length (bytes)
const KEY_LENGTH = 32;   // AES-256 requires 32-byte key

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);
  private readonly key: Buffer;

  constructor() {
    const hexKey = process.env.ENCRYPTION_KEY;

    if (!hexKey) {
      throw new InternalServerErrorException(
        'ENCRYPTION_KEY environment variable is not set. ' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
      );
    }

    if (hexKey.length !== KEY_LENGTH * 2) {
      throw new InternalServerErrorException(
        `ENCRYPTION_KEY must be ${KEY_LENGTH * 2} hex characters (${KEY_LENGTH} bytes). ` +
        `Got ${hexKey.length} characters.`,
      );
    }

    this.key = Buffer.from(hexKey, 'hex');
    this.logger.log('CryptoService initialized with AES-256-GCM');
  }

  // Encrypt a plaintext string (e.g., a GitHub access token)
  // Returns: "ivHex:authTagHex:ciphertextHex"
  encrypt(plaintext: string): string {
    // Generate a new random IV for each encryption
    // CRITICAL: Never reuse IVs with the same key in GCM mode
    // Reusing IV+Key allows an attacker to recover the plaintext via XOR
    const iv = randomBytes(IV_LENGTH);

    const cipher = createCipheriv(ALGORITHM, this.key, iv);

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    // GCM authentication tag — used to verify integrity on decrypt
    const authTag = cipher.getAuthTag();

    // Store all three components as hex, separated by colons
    return [
      iv.toString('hex'),
      authTag.toString('hex'),
      encrypted.toString('hex'),
    ].join(':');
  }

  // Decrypt a ciphertext string produced by encrypt()
  // Returns the original plaintext
  // Throws if the ciphertext has been tampered with (authTag mismatch)
  decrypt(ciphertext: string): string {
    const parts = ciphertext.split(':');

    if (parts.length !== 3) {
      throw new InternalServerErrorException(
        'Invalid ciphertext format. Expected "ivHex:authTagHex:ciphertextHex"',
      );
    }

    const [ivHex, authTagHex, encryptedHex] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = createDecipheriv(ALGORITHM, this.key, iv);

    // GCM will throw "Unsupported state or unable to authenticate data"
    // if the authTag doesn't match — this means the data was tampered with
    decipher.setAuthTag(authTag);

    try {
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);
      return decrypted.toString('utf8');
    } catch {
      throw new InternalServerErrorException(
        'Decryption failed — token may have been tampered with or the encryption key changed',
      );
    }
  }
}
