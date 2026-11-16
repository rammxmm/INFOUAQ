/**
 * Información devuelta al almacenar un archivo físico en el servidor
 */
export interface StoredFileResult {
  // Nombre físico generado en el disco (ej. 550e8400-e29b-41d4-a716-446655440000.pdf)
  nombreGuardado: string;

  // Nombre que tenía el archivo en la computadora del alumno/docente
  nombreOriginal: string;

  // Ruta relativa desde la carpeta uploads/ (ej. ITIC22/semestre-4/uuid.pdf)
  rutaRelativa: string;

  // Ruta física absoluta en el servidor
  rutaAbsoluta: string;

  // Extensión en minúsculas (ej. .pdf)
  extension: string;

  // Tipo MIME detectado (ej. application/pdf)
  mimeType: string;

  // Tamaño real en bytes
  tamanoBytes: number;
}
