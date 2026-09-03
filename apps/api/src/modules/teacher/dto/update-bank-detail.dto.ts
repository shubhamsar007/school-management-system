import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class UpdateBankDetailDto {
  @IsOptional() @IsString()
  bankName?: string;

  @IsOptional() @IsString()
  accountNumber?: string;

  @IsOptional() @IsString()
  ifscCode?: string;

  @IsOptional()
  @IsIn(['SAVINGS', 'CURRENT', 'SALARY'])
  accountType?: string;

  @IsOptional() @IsBoolean()
  isPrimary?: boolean;
}
