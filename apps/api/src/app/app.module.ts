import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LayoutService } from '../application/layout.service';
import { CanvasService } from '../application/canvas.service';
import { FileRepository } from '../infra/file.repository';
import { CanvasGateway } from '../interface/websocket/canvas.gateway';
import { McpService } from '../interface/mcp/mcp.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
      exclude: ['/api*'],
    }),
  ],
  controllers: [AppController],
  providers: [AppService, CanvasService, FileRepository, CanvasGateway, McpService, LayoutService],
})
export class AppModule { }
