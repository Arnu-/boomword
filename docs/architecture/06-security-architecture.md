# 安全架构设计

## 1. 安全架构总览

```
┌─────────────────────────────────────────────────────────────┐
│                      安全防护体系                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   网络安全层                         │   │
│  │  WAF / DDoS防护 / HTTPS / IP黑名单                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   应用安全层                         │   │
│  │  认证授权 / 输入验证 / XSS防护 / CSRF防护           │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   数据安全层                         │   │
│  │  数据加密 / 脱敏 / 访问控制 / 审计日志              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 认证授权

### 2.1 JWT 认证机制

```typescript
// JWT 配置
const jwtConfig = {
  // AccessToken 配置
  accessToken: {
    secret: process.env.JWT_SECRET,  // 256位密钥
    expiresIn: '24h',
    algorithm: 'HS256',
  },
  // RefreshToken 配置
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',
    algorithm: 'HS256',
  },
};

// Token 生成
async generateTokens(userId: string): Promise<TokenPair> {
  const payload = { sub: userId };
  
  const accessToken = await this.jwtService.signAsync(payload, {
    secret: jwtConfig.accessToken.secret,
    expiresIn: jwtConfig.accessToken.expiresIn,
  });
  
  const refreshToken = await this.jwtService.signAsync(payload, {
    secret: jwtConfig.refreshToken.secret,
    expiresIn: jwtConfig.refreshToken.expiresIn,
  });
  
  // 存储RefreshToken到Redis
  await this.redis.set(
    `auth:refresh:${userId}`,
    refreshToken,
    7 * 24 * 60 * 60,
  );
  
  return { accessToken, refreshToken };
}
```

### 2.2 RBAC 权限模型

```typescript
// 角色定义
enum Role {
  USER = 'user',           // 普通用户
  VIP = 'vip',             // VIP用户
  ADMIN = 'admin',         // 管理员
  SUPER_ADMIN = 'super_admin',  // 超级管理员
}

// 权限定义
enum Permission {
  // 用户权限
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  
  // 词库权限
  WORDBANK_READ = 'wordbank:read',
  WORDBANK_WRITE = 'wordbank:write',
  WORDBANK_DELETE = 'wordbank:delete',
  
  // 管理权限
  ADMIN_ACCESS = 'admin:access',
  USER_MANAGE = 'user:manage',
  SYSTEM_CONFIG = 'system:config',
}

// 角色权限映射
const RolePermissions: Record<Role, Permission[]> = {
  [Role.USER]: [
    Permission.USER_READ,
    Permission.WORDBANK_READ,
  ],
  [Role.VIP]: [
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.WORDBANK_READ,
  ],
  [Role.ADMIN]: [
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.WORDBANK_READ,
    Permission.WORDBANK_WRITE,
    Permission.ADMIN_ACCESS,
    Permission.USER_MANAGE,
  ],
  [Role.SUPER_ADMIN]: Object.values(Permission),
};
```

### 2.3 权限守卫

```typescript
// common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}

// 使用装饰器
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Get('users')
async getUsers() {
  // 只有管理员可访问
}
```

---

## 3. 密码安全

### 3.1 密码策略

```typescript
// 密码规则
const passwordPolicy = {
  minLength: 8,
  maxLength: 20,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false,  // 可选特殊字符
  forbiddenPatterns: [
    '123456',
    'password',
    'qwerty',
    // ... 常见弱密码
  ],
};

// 密码验证
function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (password.length < passwordPolicy.minLength) {
    errors.push(`密码长度至少${passwordPolicy.minLength}位`);
  }
  
  if (password.length > passwordPolicy.maxLength) {
    errors.push(`密码长度最多${passwordPolicy.maxLength}位`);
  }
  
  if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('密码需包含大写字母');
  }
  
  if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('密码需包含小写字母');
  }
  
  if (passwordPolicy.requireNumber && !/\d/.test(password)) {
    errors.push('密码需包含数字');
  }
  
  const lowerPassword = password.toLowerCase();
  if (passwordPolicy.forbiddenPatterns.some(p => lowerPassword.includes(p))) {
    errors.push('密码过于简单');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
```

### 3.2 密码加密

```typescript
import * as bcrypt from 'bcrypt';

// 密码哈希
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;  // 推荐12轮
  return bcrypt.hash(password, saltRounds);
}

// 密码验证
async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 3.3 登录安全

```typescript
// 登录失败限制
const loginPolicy = {
  maxAttempts: 5,          // 最大尝试次数
  lockDuration: 30 * 60,   // 锁定时长（秒）
  attemptWindow: 15 * 60,  // 统计窗口（秒）
};

// 登录尝试检查
async function checkLoginAttempts(identifier: string): Promise<void> {
  const key = `login:attempts:${identifier}`;
  const attempts = await redis.get(key);
  
  if (attempts && parseInt(attempts) >= loginPolicy.maxAttempts) {
    const ttl = await redis.ttl(key);
    throw new TooManyRequestsException(
      `登录尝试次数过多，请${Math.ceil(ttl / 60)}分钟后重试`,
    );
  }
}

// 记录登录失败
async function recordLoginFailure(identifier: string): Promise<void> {
  const key = `login:attempts:${identifier}`;
  const attempts = await redis.incr(key);
  
  if (attempts === 1) {
    await redis.expire(key, loginPolicy.attemptWindow);
  }
  
  if (attempts >= loginPolicy.maxAttempts) {
    await redis.expire(key, loginPolicy.lockDuration);
  }
}

// 登录成功清除记录
async function clearLoginAttempts(identifier: string): Promise<void> {
  const key = `login:attempts:${identifier}`;
  await redis.del(key);
}
```

---

## 4. 数据加密

### 4.1 敏感数据加密

```typescript
import * as crypto from 'crypto';

const encryptionConfig = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  authTagLength: 16,
};

// 加密服务
@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor(private configService: ConfigService) {
    const secret = this.configService.get('ENCRYPTION_KEY');
    this.key = crypto.scryptSync(secret, 'salt', encryptionConfig.keyLength);
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(encryptionConfig.ivLength);
    const cipher = crypto.createCipheriv(
      encryptionConfig.algorithm,
      this.key,
      iv,
    );

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // 格式: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(ciphertext: string): string {
    const [ivHex, authTagHex, encrypted] = ciphertext.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(
      encryptionConfig.algorithm,
      this.key,
      iv,
    );
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

### 4.2 数据脱敏

```typescript
// 脱敏工具
export const DataMasking = {
  // 手机号脱敏: 138****8000
  phone(phone: string): string {
    if (!phone || phone.length < 7) return phone;
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  },

  // 邮箱脱敏: u***@example.com
  email(email: string): string {
    if (!email) return email;
    const [name, domain] = email.split('@');
    if (!domain) return email;
    const maskedName = name.charAt(0) + '***';
    return `${maskedName}@${domain}`;
  },

  // 身份证脱敏: 110***********1234
  idCard(idCard: string): string {
    if (!idCard || idCard.length < 10) return idCard;
    return idCard.replace(/(\d{3})\d+(\d{4})/, '$1***********$2');
  },

  // 银行卡脱敏: **** **** **** 1234
  bankCard(cardNo: string): string {
    if (!cardNo || cardNo.length < 4) return cardNo;
    return '**** **** **** ' + cardNo.slice(-4);
  },
};
```

---

## 5. 输入验证与防注入

### 5.1 参数验证

```typescript
// DTO 验证示例
import { 
  IsString, 
  IsEmail, 
  MinLength, 
  MaxLength,
  Matches,
  IsOptional,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';

export class RegisterDto {
  @IsOptional()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  @MaxLength(100)
  email?: string;

  @ValidateIf(o => !o.phone && !o.email)
  @IsString({ message: '手机号或邮箱至少填写一个' })
  phoneOrEmail?: string;

  @IsString()
  @MinLength(8, { message: '密码至少8位' })
  @MaxLength(20, { message: '密码最多20位' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: '密码需包含大小写字母和数字',
  })
  password: string;

  @IsString()
  @MinLength(2, { message: '昵称至少2个字符' })
  @MaxLength(20, { message: '昵称最多20个字符' })
  @Transform(({ value }) => sanitizeHtml(value, { allowedTags: [] }))
  nickname: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: '验证码为6位数字' })
  code: string;
}
```

### 5.2 SQL 注入防护

```typescript
// Prisma ORM 自动参数化查询
// 安全示例
const user = await prisma.user.findFirst({
  where: {
    email: userInput,  // 自动转义
  },
});

// 原始查询时使用参数化
const result = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${userInput}
`;

// 禁止字符串拼接
// 危险示例（不要这样做）
// const result = await prisma.$queryRawUnsafe(
//   `SELECT * FROM users WHERE email = '${userInput}'`
// );
```

### 5.3 XSS 防护

```typescript
// 全局XSS过滤中间件
import * as sanitizeHtml from 'sanitize-html';

@Injectable()
export class XssMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.body) {
      req.body = this.sanitizeObject(req.body);
    }
    next();
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return sanitizeHtml(obj, {
        allowedTags: [],
        allowedAttributes: {},
      });
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const key of Object.keys(obj)) {
        sanitized[key] = this.sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    
    return obj;
  }
}

// 响应头安全配置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  xssFilter: true,
}));
```

---

## 6. CSRF 防护

```typescript
// CSRF Token 生成与验证
@Injectable()
export class CsrfService {
  constructor(private redis: RedisService) {}

  async generateToken(sessionId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    await this.redis.set(`csrf:${sessionId}`, token, 3600);
    return token;
  }

  async validateToken(sessionId: string, token: string): Promise<boolean> {
    const storedToken = await this.redis.get(`csrf:${sessionId}`);
    return storedToken === token;
  }
}

// CSRF 守卫
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private csrfService: CsrfService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // 只检查状态修改请求
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true;
    }

    const sessionId = request.session?.id;
    const csrfToken = request.headers['x-csrf-token'];

    if (!sessionId || !csrfToken) {
      throw new ForbiddenException('CSRF token missing');
    }

    const valid = await this.csrfService.validateToken(sessionId, csrfToken);
    if (!valid) {
      throw new ForbiddenException('CSRF token invalid');
    }

    return true;
  }
}
```

---

## 7. 安全审计日志

### 7.1 审计日志服务

```typescript
// 审计日志类型
enum AuditAction {
  // 认证相关
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  
  // 数据操作
  DATA_CREATE = 'DATA_CREATE',
  DATA_UPDATE = 'DATA_UPDATE',
  DATA_DELETE = 'DATA_DELETE',
  
  // 管理操作
  USER_BANNED = 'USER_BANNED',
  USER_UNBANNED = 'USER_UNBANNED',
  CONFIG_CHANGED = 'CONFIG_CHANGED',
}

// 审计日志实体
interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    userId: string;
    action: AuditAction;
    resource: string;
    resourceId?: string;
    oldValue?: any;
    newValue?: any;
    request: Request;
  }): Promise<void> {
    const { userId, action, resource, resourceId, oldValue, newValue, request } = params;

    await this.prisma.auditLog.create({
      data: {
        id: IdGenerator.uuid(),
        userId,
        action,
        resource,
        resourceId,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        ipAddress: this.getClientIp(request),
        userAgent: request.headers['user-agent'] || '',
        timestamp: new Date(),
      },
    });
  }

  private getClientIp(request: Request): string {
    return (
      request.headers['x-forwarded-for']?.toString().split(',')[0] ||
      request.ip ||
      'unknown'
    );
  }
}

// 使用示例
async login(dto: LoginDto, request: Request) {
  try {
    const result = await this.authService.login(dto);
    
    await this.auditService.log({
      userId: result.user.id,
      action: AuditAction.LOGIN_SUCCESS,
      resource: 'auth',
      request,
    });
    
    return result;
  } catch (error) {
    await this.auditService.log({
      userId: 'unknown',
      action: AuditAction.LOGIN_FAILED,
      resource: 'auth',
      newValue: { phone: dto.phone, reason: error.message },
      request,
    });
    throw error;
  }
}
```

---

## 8. 安全配置清单

### 8.1 环境变量安全

```bash
# .env.example
# JWT密钥（生产环境使用强随机字符串）
JWT_SECRET=your-256-bit-secret-key
JWT_REFRESH_SECRET=your-another-256-bit-secret

# 数据加密密钥
ENCRYPTION_KEY=your-encryption-key

# 数据库密码
DATABASE_PASSWORD=strong-password

# Redis密码
REDIS_PASSWORD=strong-password
```

### 8.2 安全响应头

```typescript
// Helmet 配置
app.use(helmet({
  // 内容安全策略
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://cdn.boomword.com"],
      connectSrc: ["'self'", "https://api.boomword.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  // X-Frame-Options
  frameguard: { action: 'deny' },
  // X-Content-Type-Options
  noSniff: true,
  // X-XSS-Protection
  xssFilter: true,
  // Referrer-Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // HSTS
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

### 8.3 CORS 配置

```typescript
// CORS 配置
app.enableCors({
  origin: [
    'https://boomword.com',
    'https://www.boomword.com',
    'https://admin.boomword.com',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-CSRF-Token',
  ],
  credentials: true,
  maxAge: 86400,
});
```

---

**文档版本**: v1.0  
**最后更新**: 2026-02-27
