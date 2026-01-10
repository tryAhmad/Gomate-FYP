import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { RideMode } from 'src/common/enums/ride-mode.enum';
import { RideType } from 'src/common/enums/ride-type.enum';

class GeoPointDto {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  coordinates: [number, number];
}

export class CreateRideRequestDto {
  @ValidateNested()
  @Type(() => GeoPointDto)
  pickupLocation: GeoPointDto;

  @ValidateNested()
  @Type(() => GeoPointDto)
  dropoffLocation: GeoPointDto;

  @IsNumber()
  @IsNotEmpty()
  fare: number;

  @IsEnum(RideType)
  @IsNotEmpty()
  rideType: RideType;

  @IsEnum(RideMode)
  @IsNotEmpty()
  rideMode: RideMode;

  @IsOptional()
  @IsBoolean()
  genderBasedMatching?: boolean;
}
