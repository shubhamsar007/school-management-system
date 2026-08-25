import { Module } from '@nestjs/common';
import { SubstitutionService } from './substitution.service';
import { SubstitutionController } from './substitution.controller';

@Module({
  controllers: [SubstitutionController],
  providers: [SubstitutionService],
  exports: [SubstitutionService],
})
export class SubstitutionModule {}
