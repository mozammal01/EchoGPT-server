import * as bcrypt from 'bcryptjs';

export class HashUtil {
  static async hash(data: string, saltRounds = 10): Promise<string> {
    return bcrypt.hash(data, saltRounds);
  }

  static async compare(data: string, encrypted: string): Promise<boolean> {
    return bcrypt.compare(data, encrypted);
  }
}
