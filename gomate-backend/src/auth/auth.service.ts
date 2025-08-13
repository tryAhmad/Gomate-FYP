import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassengersService } from 'src/passengers/passengers.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Role } from 'src/common/enums/roles.enum';
import { DriversService } from 'src/drivers/drivers.service';

@Injectable()
export class AuthService {
  constructor(
    private passengersService: PassengersService,
    private driversService: DriversService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string, role: Role) {
    const user =
      role === Role.Passenger
        ? await this.passengersService.findOneByEmail(email)
        : await this.driversService.findOneByEmail(email);

    if (user && user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        const { password, ...result } = user.toObject();
        return result;
      }
    }
    return null;
  }

  async login(user: any) {
    const payload = await { email: user.email, sub: user._id, role: user.role };

    console.log(`Signing ${payload.role} JWT with payload:`, payload);

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(userData: any) {
    const { email, password, role } = userData;

    if (!email || !password || !role) {
      throw new BadRequestException('Missing required fields');
    }

    const hash = await bcrypt.hash(password, 10);

    if (role === Role.Passenger) {
      const existingUser = await this.passengersService.findOneByEmail(email);
      if (existingUser) {
        throw new UnauthorizedException('Passenger already exists');
      }

      const createdPassenger = await this.passengersService.createPassenger({
        ...userData,
        password: hash,
        role: Role.Passenger,
      });

      const { password, ...result } =
        createdPassenger.toObject?.() ?? createdPassenger;
      return {
        message: 'Passenger registered successfully',
        user: result,
      };
    }

    if (role === Role.Driver) {
      const existingDriver = await this.driversService.findOneByEmail(email);
      if (existingDriver) {
        throw new UnauthorizedException('Driver already exists');
      }

      const createdDriver = await this.driversService.createDriver({
        ...userData,
        password: hash,
        role: Role.Driver,
      });

      const { password, ...result } =
        createdDriver.toObject?.() ?? createdDriver;
      return {
        message: 'Driver registered successfully',
        user: result,
      };
    }

    throw new BadRequestException('Invalid role');
  }
}
