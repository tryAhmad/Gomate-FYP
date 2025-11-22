import { IsEnum, IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePaymentStatusDto {
  @ApiProperty({ 
    example: 'paid', 
    enum: ['paid', 'pending', 'overdue'],
    description: 'Payment status'
  })
  @IsEnum(['paid', 'pending', 'overdue'])
  @IsOptional()
  paymentStatus?: 'paid' | 'pending' | 'overdue';

  @ApiProperty({ 
    example: 'active', 
    enum: ['active', 'suspended'],
    description: 'Account status'
  })
  @IsEnum(['active', 'suspended'])
  @IsOptional()
  accountStatus?: 'active' | 'suspended';

  @ApiProperty({ 
    example: '2024-03-15T00:00:00.000Z',
    description: 'Last payment date'
  })
  @IsDateString()
  @IsOptional()
  lastPaymentDate?: string;
}
