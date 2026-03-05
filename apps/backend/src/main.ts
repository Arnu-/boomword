import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 安全中间件
  app.use(helmet());
  app.use(compression());

  // CORS配置
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  // API版本控制
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // 全局前缀
  app.setGlobalPrefix('api');

  // 全局管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 全局过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局拦截器
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // Swagger文档
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('BoomWord API')
      .setDescription('BoomWord 单词泡泡消消乐 API文档')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT',
      )
      .addTag('auth', '认证相关')
      .addTag('users', '用户相关')
      .addTag('wordbanks', '词库相关')
      .addTag('levels', '关卡相关')
      .addTag('game', '游戏相关')
      .addTag('rankings', '排行榜')
      .addTag('learning', '学习统计')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  const serverUrl = await app.getUrl();
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║                                               ║
  ║   🎮 BoomWord API Server                      ║
  ║                                               ║
  ║   Running on: ${serverUrl}          ║
  ║   API Docs:   ${serverUrl}/docs     ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                    ║
  ║                                               ║
  ╚═══════════════════════════════════════════════╝
  `);
}

bootstrap();