import {
  Controller,
  Get,
  Header,
  Headers,
  HttpStatus,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { AppService } from './app.service';
import { createReadStream, statSync } from 'fs';
import { join } from 'path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/stream_from_documentation')
  @Header('Content-Type', 'video/mp4')
  @Header('Content-Disposition', 'attachment; filename="video.mp4"')
  getVideoLikeDocumentation(): StreamableFile {
    const file = createReadStream(join(process.cwd(), '/src/video.mp4'));
    return new StreamableFile(file);
  }

  @Get('/stream_video')
  @Header('Content-Type', 'video/mp4')
  @Header('Accept-Ranges', 'bytes')
  getVideo(@Headers() headers, @Res() res) {
    const videoPath = join(process.cwd(), '/src/video.mp4');
    const { size } = statSync(videoPath);
    const videoRange = headers.range;
    if (videoRange) {
      const parts = videoRange.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : size - 1;
      const chunksize = end - start + 1;
      const readStreamFile = createReadStream(videoPath, {
        start,
        end,
        highWaterMark: 60,
      });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Content-Length': chunksize,
      };
      res.writeHead(HttpStatus.PARTIAL_CONTENT, head); //206
      readStreamFile.pipe(res);
    } else {
      const head = {
        'Content-Length': size,
      };
      res.writeHead(HttpStatus.OK, head); //200
      createReadStream(videoPath).pipe(res);
    }
  }
}
