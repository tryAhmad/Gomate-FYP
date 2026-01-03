import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UploadDriverDocumentsDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'CNIC front image',
    required: false,
  })
  cnicFront?: any;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'CNIC back image',
    required: false,
  })
  cnicBack?: any;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Selfie with ID image',
    required: false,
  })
  selfieWithId?: any;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Driving license front image',
    required: false,
  })
  licenseFront?: any;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Driving license back image',
    required: false,
  })
  licenseBack?: any;
}

export class UpdateVerificationStatusDto {
  @ApiProperty({
    enum: ['incomplete', 'pending', 'approved', 'rejected'],
    description: 'Verification status',
  })
  @IsEnum(['incomplete', 'pending', 'approved', 'rejected'])
  verificationStatus: 'incomplete' | 'pending' | 'approved' | 'rejected';

  @ApiProperty({
    description: 'Reason for rejection (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
