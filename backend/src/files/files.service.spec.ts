import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';
import { FilesRepository } from './files.repository';
import { StorageService } from '../storage/storage.service';

describe('FilesService', () => {
  let service: FilesService;
  let repository: FilesRepository;
  let storage: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: FilesRepository,
          useValue: {
            obtenerTodos: jest.fn().mockResolvedValue([]),
            obtenerPorId: jest.fn().mockResolvedValue(null),
            guardar: jest.fn().mockImplementation((val) => Promise.resolve(val)),
            actualizar: jest.fn().mockImplementation((id, val) => Promise.resolve({ id, ...val })),
            eliminar: jest.fn().mockResolvedValue(true),
            incrementarDescargas: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: StorageService,
          useValue: {
            guardarArchivo: jest.fn().mockResolvedValue({
              nombreGuardado: 'uuid-123.pdf',
              nombreOriginal: 'prueba.pdf',
              rutaRelativa: 'ITIC22/semestre-1/uuid-123.pdf',
              rutaAbsoluta: '/uploads/ITIC22/semestre-1/uuid-123.pdf',
              extension: '.pdf',
              mimeType: 'application/pdf',
              tamanoBytes: 1024,
            }),
            obtenerRutaFisica: jest.fn().mockResolvedValue('/uploads/test.pdf'),
            eliminarArchivoFisico: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    repository = module.get<FilesRepository>(FilesRepository);
    storage = module.get<StorageService>(StorageService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe subir y registrar un archivo con metadatos completos', async () => {
    const fakeFile: any = {
      originalname: 'prueba.pdf',
      size: 1024,
      mimetype: 'application/pdf',
      buffer: Buffer.from('contenido'),
    };

    const dto = {
      titulo: 'Guía de Programación',
      descripcion: 'Material de apoyo',
      carreraId: 'ITIC22',
      materia: 'Introducción a la Programación',
      semestre: 1,
      categoria: 'Guías',
      autorNombre: 'Mtro. Carlos Ramírez',
      autorRol: 'Profesor',
    };

    const resultado = await service.subirArchivo(fakeFile, dto);

    expect(resultado).toBeDefined();
    expect(resultado.titulo).toBe('Guía de Programación');
    expect(resultado.carreraId).toBe('ITIC22');
    expect(resultado.semestre).toBe(1);
    expect(storage.guardarArchivo).toHaveBeenCalled();
    expect(repository.guardar).toHaveBeenCalled();
  });
});
