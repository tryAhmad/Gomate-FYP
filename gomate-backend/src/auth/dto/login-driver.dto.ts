import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDriverDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  
}
