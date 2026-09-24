import * as crypto from 'crypto';

export class CryptoUtil {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly SECRET_KEY = process.env.ENCRYPTION_KEY || 'echogpt_aes_256_secret_key_32c!';

  private static getKey(): Buffer {
    return crypto.scryptSync(this.SECRET_KEY, 'salt', 32);
  }

  static encrypt(text: string): string {
    if (!text) return text;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.ALGORITHM, this.getKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  static decrypt(encryptedText: string): string {
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
    try {
      const [ivHex, encrypted] = encryptedText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv(this.ALGORITHM, this.getKey(), iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return encryptedText;
    }
  }

  static maskApiKey(key: string): string {
    if (!key) return '';
    if (key.length <= 8) return '****';
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  }
}
