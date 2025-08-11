import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginPassengerDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}
