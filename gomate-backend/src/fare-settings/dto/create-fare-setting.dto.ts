import { IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFareSettingDto {
  @ApiProperty({ example: 'auto', enum: ['auto', 'car', 'bike'] })
  @IsEnum(['auto', 'car', 'bike'])
  rideType: 'auto' | 'car' | 'bike';

  @ApiProperty({ example: 40, description: 'Base fare in PKR' })
  @IsNumber()
  @Min(0)
  baseFare: number;

  @ApiProperty({ example: 15, description: 'Per kilometer rate in PKR' })
  @IsNumber()
  @Min(0)
  perKmRate: number;

  @ApiProperty({ example: 2, description: 'Per minute rate in PKR' })
  @IsNumber()
  @Min(0)
  perMinuteRate: number;
}
