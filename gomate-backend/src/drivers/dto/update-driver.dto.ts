import { PartialType } from '@nestjs/swagger';
import { CreateDriverDto } from './create-driver.dto';
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

class FullnameUpdateDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Firstname must be at least 3 characters long' })
  firstname?: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Lastname must be at least 3 characters long' })
  lastname?: string;
}

class VehicleUpdateDto {
  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  plate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  @IsIn(['car', 'motorcycle', 'auto'])
  vehicleType?: 'car' | 'motorcycle' | 'auto';

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  model?: string;
}

export class UpdateDriverDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => FullnameUpdateDto)
  fullname?: FullnameUpdateDto;

  @IsOptional()
  @IsEmail({}, { message: 'Please enter a valid email' })
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleUpdateDto)
  vehicle?: VehicleUpdateDto;
}
