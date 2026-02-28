import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'your-super-secret-key-at-least-32-characters-long',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshSecret:
    process.env.JWT_REFRESH_SECRET || 'another-super-secret-key-at-least-32-characters',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));
