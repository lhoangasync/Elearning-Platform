import { Injectable } from '@nestjs/common'
import { S3, S3Client } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import envConfig from '../config'
import { readFileSync } from 'fs'
@Injectable()
export class S3Service {
  private s3: S3
  constructor() {
    this.s3 = new S3({
      region: envConfig.S3_REGION,
      credentials: {
        secretAccessKey: envConfig.S3_SECRET_KEY,
        accessKeyId: envConfig.S3_ACCESS_KEY,
      },
    })
    // this.s3.listBuckets({}).then((res) => {
    //   console.log(res)
    // })
  }

  uploadFile({ filename, filepath, contentType }: { filename: string; filepath: string; contentType: string }) {
    const parallelUploads3 = new Upload({
      client: this.s3,
      params: {
        Bucket: envConfig.S3_BUCKET_NAME,
        Key: filename,
        Body: readFileSync(filepath),
        ContentType: contentType,
      },

      tags: [],
      queueSize: 4,
      partSize: 1024 * 1024 * 5,
      leavePartsOnError: false,
    })

    parallelUploads3.on('httpUploadProgress', (progress) => {
      console.log(progress)
    })

    return parallelUploads3.done()
  }
}

// const s3Instance = new S3Service()
// s3Instance
//   .uploadFile({
//     filename: 'images/8cbccdcd-a554-4ad3-9514-e1c74d87efa9.jpg',
//     filepath: 'D:/TDTU/DACNTT/online-elearning-platform/upload/8cbccdcd-a554-4ad3-9514-e1c74d87efa9.jpg',
//     contentType: 'image/jpg',
//   })
//   .then(console.log)
//   .catch(console.error)
