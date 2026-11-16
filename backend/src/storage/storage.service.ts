import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import {
  EXTENSIONES_PERMITIDAS,
  MIMES_PERMITIDOS,
  TAMANO_MAXIMO_BYTES,
} from './constants/storage.constants';
import { StoredFileResult } from './interfaces/stored-file.interface';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly uploadBaseDir: string;

  constructor(private readonly configService: ConfigService) {
    // Obtenemos la ruta base de subidas desde el .env o usamos './uploads' por defecto
    const dirConfig = this.configService.get<string>('UPLOAD_DIR', './uploads');
    this.uploadBaseDir = path.resolve(process.cwd(), dirConfig);
    this.asegurarDirectorioBase();
  }

  /**
   * Crea la carpeta principal de subidas si no existe al iniciar la app
   */
  private async asegurarDirectorioBase(): Promise<void> {
    try {
      await fs.mkdir(this.uploadBaseDir, { recursive: true });
      this.logger.log(`Carpeta de almacenamiento lista en: ${this.uploadBaseDir}`);
    } catch (error) {
      this.logger.error('Error al crear directorio base de uploads', error);
    }
  }

  /**
   * Valida que el archivo cumpla con tamaño, extensión y tipo MIME
   */
  validarArchivo(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo para almacenar.');
    }

    // 1. Validar tamaño (máximo 25MB)
    if (file.size > TAMANO_MAXIMO_BYTES) {
      const limiteMb = TAMANO_MAXIMO_BYTES / (1024 * 1024);
      throw new BadRequestException(
        `El archivo excede el tamaño máximo permitido de ${limiteMb} MB.`,
      );
    }

    // 2. Validar extensión
    const extension = path.extname(file.originalname).toLowerCase();
    if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
      throw new BadRequestException(
        `Extensión "${extension}" no permitida. Formatos válidos: ${EXTENSIONES_PERMITIDAS.join(
          ', ',
        )}`,
      );
    }

    // 3. Validar tipo MIME
    if (file.mimetype && !MIMES_PERMITIDOS.includes(file.mimetype)) {
      this.logger.warn(
        `Tipo MIME sospechoso: ${file.mimetype} para el archivo ${file.originalname}`,
      );
    }
  }

  /**
   * Guarda físicamente un archivo en la estructura uploads/{carreraId}/semestre-{semestre}/
   */
  async guardarArchivo(
    file: Express.Multer.File,
    carreraId: string,
    semestre: number,
  ): Promise<StoredFileResult> {
    // 1. Ejecutamos validaciones previas
    this.validarArchivo(file);

    // 2. Limpiamos carreraId y semestre para evitar ataques de Path Traversal (ej. ../../)
    const carreraSegura = carreraId.replace(/[^a-zA-Z0-9_-]/g, '').trim() || 'GENERAL';
    const semestreSeguro = Math.min(Math.max(Number(semestre) || 1, 1), 8);

    // 3. Carpeta destino: uploads/{carrera}/semestre-{N}/
    const subcarpeta = path.join(carreraSegura, `semestre-${semestreSeguro}`);
    const directorioDestino = path.join(this.uploadBaseDir, subcarpeta);

    // Creamos la carpeta si aún no existe
    await fs.mkdir(directorioDestino, { recursive: true });

    // 4. Generamos un nombre interno único usando UUID + extensión original
    const extension = path.extname(file.originalname).toLowerCase();
    const nombreGuardado = `${uuidv4()}${extension}`;
    const rutaAbsoluta = path.join(directorioDestino, nombreGuardado);

    // 5. Guardamos los bytes del archivo en el disco
    try {
      await fs.writeFile(rutaAbsoluta, file.buffer);
    } catch (error) {
      this.logger.error(`Fallo al escribir archivo en disco: ${rutaAbsoluta}`, error);
      throw new InternalServerErrorException(
        'No fue posible guardar el archivo en el servidor.',
      );
    }

    const rutaRelativa = path.join(subcarpeta, nombreGuardado).replace(/\\/g, '/');

    return {
      nombreGuardado,
      nombreOriginal: file.originalname,
      rutaRelativa,
      rutaAbsoluta,
      extension,
      mimeType: file.mimetype || 'application/octet-stream',
      tamanoBytes: file.size,
    };
  }

  /**
   * Obtiene la ruta física absoluta de un archivo, protegiendo contra Path Traversal
   */
  async obtenerRutaFisica(rutaRelativa: string): Promise<string> {
    // Normalizamos y resolvemos la ruta
    const rutaNormalizada = path.normalize(rutaRelativa).replace(/^(\.\.(\/|\\|$))+/, '');
    const rutaAbsoluta = path.resolve(this.uploadBaseDir, rutaNormalizada);

    // Seguridad: Verificamos que la ruta resultante esté forzosamente dentro de uploadBaseDir
    if (!rutaAbsoluta.startsWith(this.uploadBaseDir)) {
      throw new BadRequestException('Acceso a ruta de archivo no permitido.');
    }

    // Comprobamos si el archivo existe realmente en disco
    try {
      await fs.stat(rutaAbsoluta);
      return rutaAbsoluta;
    } catch {
      throw new NotFoundException('El archivo físico no fue encontrado en el servidor.');
    }
  }

  /**
   * Elimina un archivo físico del disco de forma segura
   */
  async eliminarArchivoFisico(rutaRelativa: string): Promise<boolean> {
    try {
      const rutaAbsoluta = await this.obtenerRutaFisica(rutaRelativa);
      await fs.unlink(rutaAbsoluta);
      this.logger.log(`Archivo físico eliminado: ${rutaRelativa}`);
      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(`El archivo a eliminar no existía en disco: ${rutaRelativa}`);
        return false;
      }
      throw error;
    }
  }
}
