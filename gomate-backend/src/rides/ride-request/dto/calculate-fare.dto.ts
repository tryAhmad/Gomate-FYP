import { IsNumber, IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CalculateFareDto {
  @Type(() => Number)
  @IsNumber()
  distance: number; // meters

  @Type(() => Number)
  @IsNumber()
  duration: number; // seconds

  @IsOptional()
  @IsIn(['auto', 'car', 'bike'])
  rideType?: 'auto' | 'car' | 'bike';
}
