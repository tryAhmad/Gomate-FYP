import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFareSettingDto {
  @ApiProperty({ example: 'auto', enum: ['auto', 'car', 'bike'] })
  @IsEnum(['auto', 'car', 'bike'])
  @IsOptional()
  rideType?: 'auto' | 'car' | 'bike';

  @ApiProperty({ example: 40, description: 'Base fare in PKR' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  baseFare?: number;

  @ApiProperty({ example: 15, description: 'Per kilometer rate in PKR' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  perKmRate?: number;

  @ApiProperty({ example: 2, description: 'Per minute rate in PKR' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  perMinuteRate?: number;
}
