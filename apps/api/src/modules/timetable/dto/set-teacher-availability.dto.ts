import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class TeacherAvailabilityItemDto {
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @IsBoolean()
  isAvailable: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

export class SetTeacherAvailabilityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeacherAvailabilityItemDto)
  availability: TeacherAvailabilityItemDto[];
}
