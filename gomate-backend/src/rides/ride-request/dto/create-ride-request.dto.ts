import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  ValidateNested,
} from 'class-validator';
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
  Fare: number;

  @IsEnum(RideType)
  @IsNotEmpty()
  rideType: RideType;
}
