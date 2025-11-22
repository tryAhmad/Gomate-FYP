import { IsEnum, IsNumber, IsOptional, Min, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateServiceFeeDto {
  @ApiProperty({ example: 'car', enum: ['car', 'motorcycle', 'auto'] })
  @IsEnum(['car', 'motorcycle', 'auto'])
  @IsOptional()
  vehicleType?: 'car' | 'motorcycle' | 'auto';

  @ApiProperty({ example: 500, description: 'Weekly service fee in PKR' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  weeklyFee?: number;

  @ApiProperty({ example: true, description: 'Whether the fee is currently active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
