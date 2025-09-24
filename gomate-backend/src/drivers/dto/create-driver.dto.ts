import {
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  IsIn,
  IsNumber,
  Min,
  ValidateNested,
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

export class CreateDriverDto {
  @ValidateNested()
  @Type(() => FullnameDto)
  fullname: FullnameDto;

  @IsEmail({}, { message: 'Please enter a valid email' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString()
  @MinLength(10, { message: 'Phone number must be at least 10 characters long' })
  phoneNumber: string;

  @IsOptional()
  @IsIn(['active', 'inactive'], {
    message: 'Status must be either active or inactive',
  })
  status?: 'active' | 'inactive';

  @ValidateNested()
  @Type(() => VehicleDto)
  vehicle: VehicleDto;
}
