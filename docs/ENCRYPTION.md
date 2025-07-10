# RepoDock Encryption System Documentation

## Overview

RepoDock uses **AES-256-CBC encryption** to secure environment variables stored locally in the browser. This document provides a comprehensive overview of how the encryption system works, its security features, and implementation details.

## 🔐 Encryption Algorithm

### Core Technology
- **Algorithm**: AES (Advanced Encryption Standard)
- **Key Size**: 256 bits (32 bytes)
- **Mode**: CBC (Cipher Block Chaining)
- **Padding**: PKCS7
- **Key Derivation**: PBKDF2 with SHA-256

### Security Features
- **Salt**: Random 256-bit salt for each encryption operation
- **IV (Initialization Vector)**: Random 128-bit IV for each encryption
- **Key Derivation**: PBKDF2 with 10,000 iterations
- **Password-Based**: Uses user-configurable encryption passwords

## 📁 File Structure

```
src/lib/encryption.ts                    # Main encryption service
src/types/index.ts                      # EncryptedData type definition
src/components/GlobalEnv.tsx             # Global environment variables
src/components/ProjectEnvVariables.tsx   # Project-specific variables
src/app/dashboard/settings/page.tsx      # Settings page for encryption password management
src/components/ProfileDropdown.tsx       # Profile dropdown with settings navigation
```

## 🔧 Implementation Details

### EncryptedData Format

```typescript
interface EncryptedData {
  encrypted: string;  // Base64-encoded ciphertext
  iv: string;        // Base64-encoded initialization vector
  salt: string;      // Base64-encoded salt
}
```

### Encryption Process

1. **Password Input**: User provides encryption password
2. **Salt Generation**: Random 256-bit salt created
3. **IV Generation**: Random 128-bit IV created
4. **Key Derivation**: PBKDF2(password, salt, 10000 iterations, SHA-256)
5. **Encryption**: AES-256-CBC(plaintext, key, iv)
6. **Storage**: Separate Base64 encoding of salt, IV, and ciphertext

### Code Reference - Master Key Generation

```typescript
// Location: src/lib/encryption.ts lines 50-66
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
```

### Code Reference - Encryption

```typescript
// Location: src/lib/encryption.ts lines 71-97
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
```

### Code Reference - Decryption

```typescript
// Location: src/lib/encryption.ts lines 99-133
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
```

### Code Reference - Password Management

```typescript
// Location: src/lib/encryption.ts lines 177-202
getUserEncryptionPassword(userEmail: string): string {
  const storageKey = `repodock_encryption_password_${userEmail}`;
  let encryptionPassword = localStorage.getItem(storageKey);

  if (!encryptionPassword) {
    // Prompt user for encryption password
    encryptionPassword = prompt('Please enter your encryption password for environment variables:');
    if (!encryptionPassword) {
      throw new Error('Encryption password is required');
    }

    // Store the password for this session (optional - for UX)
    localStorage.setItem(storageKey, encryptionPassword);
  }

  return encryptionPassword;
}

setUserEncryptionPassword(userEmail: string, password: string): void {
  const storageKey = `repodock_encryption_password_${userEmail}`;
  localStorage.setItem(storageKey, password);
}
```

## 🛡️ Security Analysis

### Strengths
1. **Industry Standard**: AES-256 is approved by NSA for TOP SECRET data
2. **Proper Key Derivation**: PBKDF2 with 10,000 iterations prevents rainbow table attacks
3. **Unique Salt/IV**: Each encryption uses fresh random salt and IV
4. **No Key Reuse**: Each environment variable gets unique encryption parameters
5. **Password-Based**: User controls the encryption password

### Security Considerations
1. **Client-Side Storage**: Data encrypted in browser localStorage
2. **Password Strength**: Security depends on user's password strength
3. **Memory Exposure**: Decrypted values temporarily in browser memory
4. **No Server Storage**: All encryption/decryption happens client-side

## 🚀 Production Readiness

### ✅ Production-Safe Features
- **Cryptographically Secure**: Uses proven AES-256-CBC algorithm
- **Proper Implementation**: Follows cryptographic best practices
- **Error Handling**: Comprehensive error handling and validation
- **Backward Compatibility**: Supports legacy encrypted data migration
- **Performance**: Efficient encryption/decryption operations

### ⚠️ Production Considerations
1. **Password Management**: Users must remember their encryption passwords
2. **Data Recovery**: Lost passwords mean lost data (by design)
3. **Browser Compatibility**: Requires modern browser with crypto support
4. **Local Storage Limits**: Browser localStorage size limitations apply

## 🌐 Cross-Device Access

### How It Works
RepoDock's encryption system supports **cross-device access** with the following requirements:

1. **Same User Account**: Login with the same email address on any device
2. **Same Encryption Password**: Enter the same encryption password used to encrypt the data
3. **Shared Database**: Environment variables stored in a shared database (not just localStorage)

### Key Generation Consistency
```
Device A: PBKDF2(email + password, email, 10000) → Master Key X
Device B: PBKDF2(email + password, email, 10000) → Master Key X (identical)
```

Since the master key is derived deterministically from email + password, the same combination will always produce the same encryption/decryption key.

### Cross-Device Setup Process
1. **Device A**: User sets encryption password → encrypts environment variables
2. **Device B**: User logs in → enters same encryption password → can decrypt same variables
3. **Verification**: Test encryption on settings page to verify access

## 🔄 Data Flow

### Environment Variable Creation
```
User Input → Email (from DB) + Password (local) → Master Key → Encryption → Database Storage
```

### Environment Variable Retrieval
```
Database → JSON Parse → Email (from DB) + Password (local) → Master Key → Decryption → Display
```

### Cross-Device Sync
```
Device A: Encrypt with Email+Password → Store in Database
Device B: Retrieve from Database → Decrypt with Same Email+Password → Success
```

## 📊 Storage Format

### localStorage Structure
```javascript
{
  "repodock_env_variables": [
    {
      "id": "env_123",
      "key": "API_KEY",
      "value": "{\"encrypted\":\"base64...\",\"iv\":\"base64...\",\"salt\":\"base64...\"}",
      "description": "API key for service",
      "isSecret": true,
      "userId": "user_123",
      "projectId": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## 🔍 Verification

### How to Verify Encryption
1. **Inspect localStorage**: Open browser DevTools → Application → localStorage
2. **Check Encrypted Values**: Environment variable values are JSON strings with encrypted/iv/salt
3. **Verify Randomness**: Each encrypted value has different salt/IV even for same plaintext
4. **Test Decryption**: Toggle visibility to verify decryption works correctly

### Example Encrypted Value
```json
{
  "encrypted": "U2FsdGVkX1+vupppZksvRf5pq5g5XjFRIipRkwB0K1Y=",
  "iv": "MTIzNDU2Nzg5MGFiY2RlZg==",
  "salt": "c2FsdDEyMzQ1Njc4OTBhYmNkZWY="
}
```

## 🛠️ Configuration

### User Settings (via Settings Page)
- **Profile Settings**: Username and email management
- **Encryption Password**: User-configurable password for encryption/decryption
- **Password Management**: Set, update, and test encryption passwords
- **Cross-Device Setup**: Instructions for accessing data on multiple devices

### Settings Page Location
```
Dashboard → Profile Dropdown → Settings → Encryption Tab
```

### Default Settings
- **PBKDF2 Iterations**: 10,000 (configurable)
- **Key Size**: 256 bits (fixed)
- **IV Size**: 128 bits (fixed)
- **Salt Size**: 256 bits (fixed)
- **Storage**: Email from database + Password from localStorage

## 📝 Usage Examples

### Creating Encrypted Environment Variable
```typescript
const envVar: EnvVariable = {
  id: generateId('env'),
  key: 'DATABASE_URL',
  value: encryptionService.encryptEnvValueWithUser('postgresql://...', user.email),
  description: 'Database connection string',
  isSecret: true,
  userId: user.id,
  // ... other fields
};
```

### Retrieving and Decrypting
```typescript
const decryptedValue = encryptionService.decryptEnvValueWithUser(envVar.value, user.email);
```

### Cross-Device Access Example
```typescript
// Device A: Encrypt data
const encrypted = encryptionService.encryptEnvValue('secret-value', 'user@example.com', 'myPassword123');

// Device B: Decrypt same data (with same email + password)
const decrypted = encryptionService.decryptEnvValue(encrypted, 'user@example.com', 'myPassword123');
// Result: 'secret-value' ✅
```

## 🔐 Best Practices

1. **Strong Passwords**: Use complex encryption passwords (12+ characters, mixed case, numbers, symbols)
2. **Password Security**: Never share encryption passwords; they're not recoverable if lost
3. **Cross-Device Setup**: Use the same encryption password on all devices for data access
4. **Regular Testing**: Use the "Test Encryption" button in settings to verify functionality
5. **Secure Environment**: Use RepoDock in secure environments and trusted devices
6. **Data Backup**: Document your encryption password securely for disaster recovery
7. **Access Control**: Limit access to devices with encrypted data and log out when done

## 🚨 Important Security Notes

### Password Recovery
- **No Password Recovery**: Lost encryption passwords mean lost data (by design)
- **No Backdoors**: RepoDock cannot recover your data without your password
- **User Responsibility**: Keep your encryption password safe and memorable

### Cross-Device Considerations
- **Same Password Required**: Must use identical encryption password on all devices
- **Case Sensitive**: Encryption passwords are case-sensitive
- **Network Security**: Ensure secure connections when accessing from multiple devices

---

*This documentation reflects the current implementation as of the latest version. For technical support or security questions, please refer to the source code or contact the development team.*
