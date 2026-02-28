import { v4 as uuidv4 } from 'uuid';

export class IdGenerator {
  static uuid(): string {
    return uuidv4();
  }

  static userId(): string {
    return `usr_${this.shortId()}`;
  }

  static gameSession(): string {
    return `gs_${this.shortId()}`;
  }

  static gameRecord(): string {
    return `gr_${this.shortId()}`;
  }

  private static shortId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}${random}`;
  }
}
