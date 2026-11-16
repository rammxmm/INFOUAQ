import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FilesRepository } from './files.repository';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [FilesController],
  providers: [FilesService, FilesRepository],
  exports: [FilesService, FilesRepository],
})
export class FilesModule {}
