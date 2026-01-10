import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Matches,
} from 'class-validator';

import { Role } from 'src/common/enums/roles.enum';

export class CreatePassengerDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsStrongPassword()
  password: string;

  @IsNotEmpty()
  @Matches(/^[0-9]{11}$/, {
    message: 'Phone number must be a 11-digit number',
  })
  phoneNumber: string;

  @IsNotEmpty()
  @IsEnum(['male', 'female', 'other'], {
    message: 'Gender must be male, female, or other',
  })
  gender: string;

  @IsEnum(Role)
  role: Role;
}
