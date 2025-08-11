import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, Matches } from "class-validator";

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
        message: 'Phone number must be a 11-digit number'
    })
    phoneNumber: string;
}
