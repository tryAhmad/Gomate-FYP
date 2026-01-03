import {
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  IsIn,
  IsNumber,
  Min,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

class FullnameDto {
  @IsString()
  @MinLength(3, { message: 'Firstname must be at least 3 characters long' })
  firstname: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Lastname must be at least 3 characters long' })
  lastname?: string;
}

class LocationDto {
  @IsString()
  type: string;

  @IsArray()
  @IsNumber({}, { each: true })
  coordinates: [number, number];
}

class VehicleDto {
  @IsString()
  @MinLength(3, { message: 'Color must be at least 3 characters long' })
  color: string;

  @IsString()
  @MinLength(3, { message: 'Plate must be at least 3 characters long' })
  plate: string;

  @IsNumber()
  @Min(1, { message: 'Capacity must be at least 1' })
  capacity: number;

  @IsString()
  @IsIn(['car', 'motorcycle', 'auto'], {
    message: 'vehicleType must be one of: car, motorcycle, auto',
  })
  vehicleType: 'car' | 'motorcycle' | 'auto';
}

export class RegisterDriverDto {
  @ValidateNested()
  @Type(() => FullnameDto)
  fullname: FullnameDto;

  @IsEmail({}, { message: 'Please enter a valid email' })
  email: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @IsOptional()
  @IsIn(['active', 'inactive'], {
    message: 'Status must be either active or inactive',
  })
  status?: 'active' | 'inactive';

  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleDto)
  vehicle?: VehicleDto;
}
