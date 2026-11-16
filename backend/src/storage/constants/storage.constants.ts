/**
 * Constantes de configuración y seguridad para el almacenamiento de archivos
 * Proyecto: INFOUAQ - Repositorio Académico
 */

// Extensiones de archivo permitidas en la plataforma
export const EXTENSIONES_PERMITIDAS: readonly string[] = [
  '.pdf',
  '.docx',
  '.doc',
  '.pptx',
  '.ppt',
  '.xlsx',
  '.xls',
  '.png',
  '.jpg',
  '.jpeg',
  '.zip',
];

// Tipos MIME permitidos correspondientes
export const MIMES_PERMITIDOS: readonly string[] = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'image/png',
  'image/jpeg',
  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream', // Algunos navegadores envían zip o binarios así
];

// Tamaño máximo permitido por archivo: 25 Megabytes
export const TAMANO_MAXIMO_BYTES = 25 * 1024 * 1024;
