import { Post, Body, UnauthorizedException, Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginPassengerDto } from './dto/login-passenger.dto';
import { RegisterPassengerDto } from './dto/register-passenger.dto';
import { RegisterDriverDto } from './dto/register-driver.dto';
import { Role } from 'src/common/enums/roles.enum';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginDriverDto } from './dto/login-driver.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('passenger/login')
  @ApiOperation({ summary: 'Login Passenger' })
  async loginPassenger(@Body() loginPassengerDto: LoginPassengerDto) {
    const user = await this.authService.validateUser(
      loginPassengerDto.email,
      loginPassengerDto.password,
      Role.Passenger,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('passenger/register')
  @ApiOperation({ summary: 'Register Passenger' })
  async registerPassenger(@Body() registerPassengerDto: RegisterPassengerDto) {
    return this.authService.registerPassenger(registerPassengerDto);
  }

  @Post('driver/register')
  @ApiOperation({ summary: 'Register Driver' })
  async registerDriver(@Body() registerDriverDto: RegisterDriverDto) {
    return this.authService.registerDriver(registerDriverDto);
  }

  @Post('driver/login')
  @ApiOperation({ summary: 'Login Driver' })
  async loginDriver(@Body() loginDriverDto: LoginDriverDto) {
    const user = await this.authService.validateUser(
      loginDriverDto.email,
      loginDriverDto.password,
      Role.Driver,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid Credentials');
    }
    return this.authService.login(user);
  }
}
