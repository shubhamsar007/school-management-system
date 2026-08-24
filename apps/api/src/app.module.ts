import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import appConfig from './config/app.config';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
      { name: 'long', ttl: 60000, limit: 200 },
    ]),

    // Internal event bus
    EventEmitterModule.forRoot({ wildcard: true }),

    // Cron jobs
    ScheduleModule.forRoot(),

    // Feature modules added here as they are built
    // IdentityModule,
    // OrganizationModule,
    // StudentsModule,
    // ...
  ],
})
export class AppModule {}
