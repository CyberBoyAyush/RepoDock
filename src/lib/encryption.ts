// Location: src/lib/encryption.ts
// Description: 256-bit encryption utilities for RepoDock.dev - handles secure encryption/decryption of environment variables using AES-256-CBC encryption for enhanced security

import CryptoJS from 'crypto-js';
import { EncryptedData } from '@/types';
import { showEncryptionPasswordModal } from '@/components/EncryptionPasswordModal';

class EncryptionService {
  private static instance: EncryptionService;
  private readonly keySize = 256 / 32; // 256 bits / 32 bits per word
  private readonly ivSize = 128 / 32; // 128 bits / 32 bits per word
  private readonly iterations = 10000; // PBKDF2 iterations

  private constructor() {}

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Generate a secure key from password using PBKDF2
   */
  private generateKey(password: string, salt: CryptoJS.lib.WordArray): CryptoJS.lib.WordArray {
    return CryptoJS.PBKDF2(password, salt, {
      keySize: this.keySize,
      iterations: this.iterations,
      hasher: CryptoJS.algo.SHA256
    });
  }

  /**
   * Generate a random salt
   */
  private generateSalt(): CryptoJS.lib.WordArray {
    return CryptoJS.lib.WordArray.random(this.keySize);
  }

  /**
   * Generate a random IV
   */
  private generateIV(): CryptoJS.lib.WordArray {
    return CryptoJS.lib.WordArray.random(this.ivSize);
  }

  /**
   * Get master key from user email + encryption password
   */
  private getMasterKey(userEmail: string, encryptionPassword: string): string {
    if (!userEmail || !encryptionPassword) {
      throw new Error('User email and encryption password are required');
    }

    // Combine email and encryption password to create a unique master key
    const combinedKey = `${userEmail}:${encryptionPassword}`;

    // Use PBKDF2 to derive a consistent master key from the combined string
    const masterKey = CryptoJS.PBKDF2(combinedKey, userEmail, {
      keySize: 256/32,
      iterations: this.iterations,
      hasher: CryptoJS.algo.SHA256
    });

    return masterKey.toString();
  }

  /**
   * Encrypt a value using AES-256-CBC
   */
  encrypt(value: string, userEmail: string, encryptionPassword: string): EncryptedData {
    try {
      const masterKey = this.getMasterKey(userEmail, encryptionPassword);
      const salt = this.generateSalt();
      const iv = this.generateIV();

      const key = this.generateKey(masterKey, salt);

      const encrypted = CryptoJS.AES.encrypt(value, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      return {
        encrypted: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
        iv: iv.toString(CryptoJS.enc.Base64),
        salt: salt.toString(CryptoJS.enc.Base64)
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt a value using AES-256-CBC
   */
  decrypt(encryptedData: EncryptedData, userEmail: string, encryptionPassword: string): string {
    try {
      const masterKey = this.getMasterKey(userEmail, encryptionPassword);

      // Parse the separate components
      const salt = CryptoJS.enc.Base64.parse(encryptedData.salt);
      const iv = CryptoJS.enc.Base64.parse(encryptedData.iv);
      const ciphertext = CryptoJS.enc.Base64.parse(encryptedData.encrypted);

      const key = this.generateKey(masterKey, salt);

      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: ciphertext } as CryptoJS.lib.CipherParams,
        key,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );

      const result = decrypted.toString(CryptoJS.enc.Utf8);
      if (!result) {
        throw new Error('Decryption resulted in empty string');
      }

      return result;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash a password for storage
   */
  hashPassword(password: string): string {
    const salt = CryptoJS.lib.WordArray.random(128/8);
    const hash = CryptoJS.PBKDF2(password, salt, {
      keySize: 256/32,
      iterations: this.iterations,
      hasher: CryptoJS.algo.SHA256
    });
    
    return salt.toString() + ':' + hash.toString();
  }

  /**
   * Verify a password against a hash
   */
  verifyPassword(password: string, hash: string): boolean {
    try {
      const [saltStr, hashStr] = hash.split(':');
      const salt = CryptoJS.enc.Hex.parse(saltStr);
      
      const computedHash = CryptoJS.PBKDF2(password, salt, {
        keySize: 256/32,
        iterations: this.iterations,
        hasher: CryptoJS.algo.SHA256
      });
      
      return computedHash.toString() === hashStr;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * Generate a secure random token
   */
  generateToken(length: number = 32): string {
    return CryptoJS.lib.WordArray.random(length).toString();
  }

  /**
   * Get user's encryption password from localStorage or show modal
   */
  async getUserEncryptionPassword(userEmail: string): Promise<string> {
    const storageKey = `repodock_encryption_password_${userEmail}`;
    let encryptionPassword = localStorage.getItem(storageKey);

    if (!encryptionPassword) {
      try {
        // Show modal for encryption password
        encryptionPassword = await showEncryptionPasswordModal(userEmail);

        if (!encryptionPassword) {
          throw new Error('Encryption password is required');
        }

        // Store the password for this session
        localStorage.setItem(storageKey, encryptionPassword);
      } catch (error) {
        throw new Error('Encryption password is required');
      }
    }

    return encryptionPassword;
  }

  /**
   * Set user's encryption password
   */
  setUserEncryptionPassword(userEmail: string, password: string): void {
    const storageKey = `repodock_encryption_password_${userEmail}`;
    localStorage.setItem(storageKey, password);
  }

  /**
   * Clear encryption password (for logout)
   */
  clearUserEncryptionPassword(userEmail: string): void {
    const storageKey = `repodock_encryption_password_${userEmail}`;
    localStorage.removeItem(storageKey);
  }

  /**
   * Clear master key (for logout) - deprecated
   */
  clearMasterKey(userId: string): void {
    // This method is kept for backward compatibility
    const storageKey = `repodock_master_key_${userId}`;
    localStorage.removeItem(storageKey);
  }

  /**
   * Validate encrypted data format
   */
  isValidEncryptedData(data: any): data is EncryptedData {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.encrypted === 'string' &&
      typeof data.iv === 'string' &&
      typeof data.salt === 'string'
    );
  }

  /**
   * Encrypt environment variable value
   */
  encryptEnvValue(value: string, userEmail: string, encryptionPassword: string): string {
    const encrypted = this.encrypt(value, userEmail, encryptionPassword);
    return JSON.stringify(encrypted);
  }

  /**
   * Decrypt legacy format (for backward compatibility)
   */
  private decryptLegacy(encryptedData: { encrypted: string; iv: string }, userEmail: string, encryptionPassword: string): string {
    try {
      const masterKey = this.getMasterKey(userEmail, encryptionPassword);
      const combined = CryptoJS.enc.Base64.parse(encryptedData.encrypted);

      // Extract salt, iv, and ciphertext from combined format
      const salt = CryptoJS.lib.WordArray.create(combined.words.slice(0, this.keySize));
      const iv = CryptoJS.lib.WordArray.create(combined.words.slice(this.keySize, this.keySize + this.ivSize));
      const ciphertext = CryptoJS.lib.WordArray.create(combined.words.slice(this.keySize + this.ivSize));

      const key = this.generateKey(masterKey, salt);

      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: ciphertext } as CryptoJS.lib.CipherParams,
        key,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );

      const result = decrypted.toString(CryptoJS.enc.Utf8);
      if (!result) {
        throw new Error('Legacy decryption resulted in empty string');
      }

      return result;
    } catch (error) {
      console.error('Legacy decryption error:', error);
      throw new Error('Failed to decrypt legacy data');
    }
  }

  /**
   * Decrypt environment variable value
   */
  decryptEnvValue(encryptedValue: string, userEmail: string, encryptionPassword: string): string {
    try {
      const encryptedData = JSON.parse(encryptedValue);

      // Check if it's the new format with salt
      if (this.isValidEncryptedData(encryptedData)) {
        return this.decrypt(encryptedData, userEmail, encryptionPassword);
      }

      // Handle legacy format (without salt) - for backward compatibility
      if (typeof encryptedData === 'object' &&
          encryptedData !== null &&
          typeof encryptedData.encrypted === 'string' &&
          typeof encryptedData.iv === 'string') {

        console.warn('Using legacy encryption format, consider re-encrypting data');
        return this.decryptLegacy(encryptedData, userEmail, encryptionPassword);
      }

      throw new Error('Invalid encrypted data format');
    } catch (error) {
      console.error('Failed to decrypt environment variable:', error);
      throw error; // Re-throw to let the calling component handle the error
    }
  }

  /**
   * Convenience method: Encrypt environment variable with auto-retrieved password
   */
  async encryptEnvValueWithUser(value: string, userEmail: string): Promise<string> {
    const encryptionPassword = await this.getUserEncryptionPassword(userEmail);
    return this.encryptEnvValue(value, userEmail, encryptionPassword);
  }

  /**
   * Convenience method: Decrypt environment variable with auto-retrieved password
   */
  async decryptEnvValueWithUser(encryptedValue: string, userEmail: string): Promise<string> {
    const encryptionPassword = await this.getUserEncryptionPassword(userEmail);
    return this.decryptEnvValue(encryptedValue, userEmail, encryptionPassword);
  }



  /**
   * Re-encrypt all user data with new master key (for key rotation)
   */
  rotateUserKeys(userId: string, oldMasterKey?: string): void {
    // This would be used for key rotation in a production environment
    // For now, we'll just generate a new master key
    const storageKey = `repodock_master_key_${userId}`;
    const newMasterKey = CryptoJS.lib.WordArray.random(256/8).toString();
    localStorage.setItem(storageKey, newMasterKey);
  }
}

export const encryptionService = EncryptionService.getInstance();
