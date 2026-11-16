import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, defaultVal: any) => defaultVal,
          },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe rechazar archivos con extensiones no permitidas (.exe)', () => {
    const fakeFile: any = {
      originalname: 'virus.exe',
      size: 1024,
      mimetype: 'application/x-msdownload',
      buffer: Buffer.from('test'),
    };

    expect(() => service.validarArchivo(fakeFile)).toThrow(BadRequestException);
  });

  it('debe rechazar archivos mayores a 25MB', () => {
    const fakeFile: any = {
      originalname: 'documento.pdf',
      size: 30 * 1024 * 1024, // 30 MB
      mimetype: 'application/pdf',
      buffer: Buffer.from('test'),
    };

    expect(() => service.validarArchivo(fakeFile)).toThrow(BadRequestException);
  });

  it('debe aceptar archivos válidos (.pdf de tamaño adecuado)', () => {
    const fakeFile: any = {
      originalname: 'guia_estudio.pdf',
      size: 2 * 1024 * 1024, // 2 MB
      mimetype: 'application/pdf',
      buffer: Buffer.from('test'),
    };

    expect(() => service.validarArchivo(fakeFile)).not.toThrow();
  });
});
