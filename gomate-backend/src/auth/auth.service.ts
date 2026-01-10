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

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        phoneNumber: user.phoneNumber || user.phone,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    };
  }

  async registerPassenger(userData: any) {
    const { email, password } = userData;

    if (!email || !password) {
      throw new BadRequestException('Missing required fields');
    }

    const existingUser = await this.passengersService.findOneByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('Passenger already exists');
    }

    const hash = await bcrypt.hash(password, 10);

    const createdPassenger = await this.passengersService.createPassenger({
      ...userData,
      password: hash,
      role: Role.Passenger, // force passenger role
    });

    const { password: _, ...result } =
      createdPassenger.toObject?.() ?? createdPassenger;

    return {
      message: 'Passenger registered successfully',
      user: result,
    };
  }

  async registerDriver(userData: any) {
    const { email, password } = userData;

    if (!email || !password) {
      throw new BadRequestException('Missing required fields');
    }

    const existingDriver = await this.driversService.findOneByEmail(email);
    if (existingDriver) {
      throw new UnauthorizedException('Driver already exists');
    }

    const hash = await bcrypt.hash(password, 10);

    const createdDriver = await this.driversService.createDriver({
      ...userData,
      password: hash,
      role: Role.Driver,
      isApproved: false, // admin must approve
    });

    const { password: _, ...result } =
      createdDriver.toObject?.() ?? createdDriver;

    // Generate JWT token for auto-login
    const token = this.jwtService.sign({
      email: result.email,
      userId: result._id,
      role: result.role,
    });

    return {
      message: 'Driver registered successfully, waiting for admin approval',
      driver: result,
      token,
    };
  }
}
