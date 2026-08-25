import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { IdentityService } from '../identity.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private identityService: IdentityService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string) {
    const user = await this.identityService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return user;
  }
}
