import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import { AcademicFile } from './entities/academic-file.entity';

/**
 * Repositorio local de archivos académicos.
 * Almacena los metadatos en un archivo JSON en disco (backend/data/archivos.json).
 * Cuando se integre Prisma y PostgreSQL, este repositorio será reemplazado
 * sin necesidad de alterar los controladores ni los servicios de Angular.
 */
@Injectable()
export class FilesRepository {
  private readonly logger = new Logger(FilesRepository.name);
  private readonly dataFilePath = path.resolve(process.cwd(), 'data', 'archivos.json');

  constructor() {
    this.asegurarArchivoDatos();
  }

  /**
   * Crea el archivo data/archivos.json con un arreglo vacío si aún no existe
   */
  private async asegurarArchivoDatos(): Promise<void> {
    try {
      await fs.access(this.dataFilePath);
    } catch {
      await fs.mkdir(path.dirname(this.dataFilePath), { recursive: true });
      await fs.writeFile(this.dataFilePath, JSON.stringify([], null, 2), 'utf-8');
      this.logger.log(`Archivo de datos inicializado en: ${this.dataFilePath}`);
    }
  }

  /**
   * Lee todos los documentos almacenados en el archivo JSON
   */
  async obtenerTodos(): Promise<AcademicFile[]> {
    try {
      const raw = await fs.readFile(this.dataFilePath, 'utf-8');
      return JSON.parse(raw) as AcademicFile[];
    } catch (error) {
      this.logger.error('Error al leer archivos.json', error);
      return [];
    }
  }

  /**
   * Sobrescribe el archivo JSON con la lista actualizada de documentos
   */
  private async escribirTodos(archivos: AcademicFile[]): Promise<void> {
    await fs.writeFile(this.dataFilePath, JSON.stringify(archivos, null, 2), 'utf-8');
  }

  /**
   * Busca un documento académico por su identificador UUID
   */
  async obtenerPorId(id: string): Promise<AcademicFile | null> {
    const archivos = await this.obtenerTodos();
    return archivos.find((a) => a.id === id) || null;
  }

  /**
   * Agrega un nuevo documento a la lista
   */
  async guardar(nuevo: AcademicFile): Promise<AcademicFile> {
    const archivos = await this.obtenerTodos();
    archivos.unshift(nuevo); // Agregar al inicio (más reciente primero)
    await this.escribirTodos(archivos);
    return nuevo;
  }

  /**
   * Actualiza los datos de un documento existente
   */
  async actualizar(id: string, datos: Partial<AcademicFile>): Promise<AcademicFile | null> {
    const archivos = await this.obtenerTodos();
    const index = archivos.findIndex((a) => a.id === id);

    if (index === -1) {
      return null;
    }

    archivos[index] = {
      ...archivos[index],
      ...datos,
      fechaActualizacion: new Date().toISOString(),
    };

    await this.escribirTodos(archivos);
    return archivos[index];
  }

  /**
   * Incrementa en 1 el contador de descargas de un documento
   */
  async incrementarDescargas(id: string): Promise<void> {
    const archivos = await this.obtenerTodos();
    const item = archivos.find((a) => a.id === id);
    if (item) {
      item.descargas = (item.descargas || 0) + 1;
      await this.escribirTodos(archivos);
    }
  }

  /**
   * Elimina un documento por su ID del archivo JSON
   */
  async eliminar(id: string): Promise<boolean> {
    const archivos = await this.obtenerTodos();
    const inicial = archivos.length;
    const filtrados = archivos.filter((a) => a.id !== id);

    if (filtrados.length === inicial) {
      return false;
    }

    await this.escribirTodos(filtrados);
    return true;
  }
}
