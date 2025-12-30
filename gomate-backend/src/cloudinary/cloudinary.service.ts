import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Upload a file to Cloudinary
   * @param file - The file buffer or path to upload
   * @param folder - The folder path in Cloudinary
   * @returns Upload result with secure_url and public_id
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
        },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            reject(
              new BadRequestException(`Image upload failed: ${error.message}`),
            );
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  /**
   * Upload multiple images to Cloudinary
   * @param files - Array of files to upload
   * @param folder - The base folder path in Cloudinary
   * @returns Array of upload results
   */
  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string,
  ): Promise<Array<{ url: string; publicId: string }>> {
    const uploadPromises = files.map((file) => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete an image from Cloudinary
   * @param publicId - The public ID of the image to delete
   * @returns Deletion result
   */
  async deleteImage(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      throw new BadRequestException(`Image deletion failed: ${error.message}`);
    }
  }

  /**
   * Delete multiple images from Cloudinary
   * @param publicIds - Array of public IDs to delete
   * @returns Deletion results
   */
  async deleteMultipleImages(publicIds: string[]): Promise<any> {
    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      return result;
    } catch (error) {
      throw new BadRequestException(
        `Multiple image deletion failed: ${error.message}`,
      );
    }
  }
}
