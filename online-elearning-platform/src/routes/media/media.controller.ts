import {
  Controller,
  Get,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
  Post,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { type Response } from 'express'
import path from 'path'
import envConfig from 'src/shared/config'
import { UPLOAD_DIR } from 'src/shared/constants/other.constant'
import { IsPublic } from 'src/shared/decorators/auth.decorator'
import { S3Service } from 'src/shared/services/s3.service'
import { MediaService } from './media.service'

@Controller('media')
export class MediaController {
  constructor(private mediaService: MediaService) {}
  @Post('images/upload')
  @UseInterceptors(
    FilesInterceptor('files', 100, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  uploadFile(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          // new FileTypeValidator({ fileType: /image\/(jpeg|png|webp)/ }),
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        ],
      }),
    )
    files: Array<Express.Multer.File>,
  ) {
    return this.mediaService.uploadFile(files)
  }

  @Get('static/:filename')
  @IsPublic()
  serverFile(@Param('filename') filename: string, @Res() res: Response) {
    return res.sendFile(path.resolve(UPLOAD_DIR, filename), (error) => {
      if (error) {
        const notfound = new NotFoundException('File not found')
        res.status(notfound.getStatus()).json(notfound.getResponse())
      }
    })
  }
}
