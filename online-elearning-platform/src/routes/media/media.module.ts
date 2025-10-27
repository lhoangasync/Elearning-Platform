import { Module } from '@nestjs/common'
import { MediaController } from './media.controller'
import { MulterModule } from '@nestjs/platform-express'
import multer from 'multer'
import path from 'path'
import { generateRandomFilename } from 'src/shared/helper'
import { existsSync, mkdirSync } from 'fs'
import { UPLOAD_DIR } from 'src/shared/constants/other.constant'
import { MediaService } from './media.service'

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR)
  },
  filename: function (req, file, cb) {
    const newFilename = generateRandomFilename(file.originalname)
    cb(null, newFilename)
  },
})
@Module({
  imports: [
    MulterModule.register({
      storage,
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {
  constructor() {
    if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true })
    }
  }
}
