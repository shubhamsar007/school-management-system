import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class CreateBankDetailDto {
  @IsString() @IsNotEmpty()
  bankName: string;

  @IsString() @IsNotEmpty()
  accountNumber: string;

  @IsString() @IsNotEmpty()
  ifscCode: string;

  @IsOptional()
  @IsIn(['SAVINGS', 'CURRENT', 'SALARY'])
  accountType?: string;

  @IsOptional() @IsBoolean()
  isPrimary?: boolean;
}
