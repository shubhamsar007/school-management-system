import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IdentityService } from './identity.service';
import { IdentityController } from './identity.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('app.jwt.accessSecret') as string,
        signOptions: { expiresIn: config.get<number>('app.jwt.accessTtl') as number },
      }),
    }),
  ],
  controllers: [IdentityController],
  providers: [IdentityService, LocalStrategy, JwtStrategy],
  exports: [JwtModule, JwtStrategy],
})
export class IdentityModule {}
