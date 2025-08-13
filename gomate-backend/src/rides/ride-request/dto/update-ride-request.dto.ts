import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class LocationDto {
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @IsNumber()
  @IsNotEmpty()
  lng: number;
}

export class UpdateRideRequestDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  pickupLocation?: LocationDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  dropoffLocation?: LocationDto;

  @IsOptional()
  @IsNumber()
  fare?: number;

  @IsOptional()
  @IsString()
  status?: 'pending' | 'accepted' | 'started' | 'completed' | 'cancelled';

  @IsOptional()
  @IsString()
  driverId?: string;
}
