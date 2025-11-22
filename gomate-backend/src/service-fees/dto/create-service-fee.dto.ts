import { IsEnum, IsNumber, Min, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceFeeDto {
  @ApiProperty({ example: 'car', enum: ['car', 'motorcycle', 'auto'] })
  @IsEnum(['car', 'motorcycle', 'auto'])
  vehicleType: 'car' | 'motorcycle' | 'auto';

  @ApiProperty({ example: 500, description: 'Weekly service fee in PKR' })
  @IsNumber()
  @Min(0)
  weeklyFee: number;

  @ApiProperty({ example: true, description: 'Whether the fee is currently active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
