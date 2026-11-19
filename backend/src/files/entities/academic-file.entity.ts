/**
 * Modelo de datos de un Documento Académico en INFOUAQ
 * Esta estructura sirve como base directa para la tabla de PostgreSQL en Prisma
 */
export interface AcademicFile {
  id: string;                      // Identificador numérico como string
  titulo: string;                  // Nombre o título descriptivo asignado al recurso
  descripcion: string;             // Explicación breve del contenido académico
  nombreOriginal: string;          // Nombre del archivo original (ej. Guia_Examen.pdf)
  nombreFisico: string;            // Nombre físico seguro con UUID en disco
  rutaRelativa: string;            // Ruta relativa dentro de uploads/
  extension: string;               // Extensión en minúsculas (ej. .pdf)
  mimeType: string;                // Tipo MIME (ej. application/pdf)
  tamanoBytes: number;             // Peso exacto en bytes
  tamanoFormateado: string;        // Peso legible para la UI (ej. "3.4 MB")
  carreraId: string;               // Identificador de la carrera (ej. ITIC22, SOF18)
  materia: string;                 // Nombre de la materia relacionada
  materiaId?: number;              // ID de la materia en BD
  semestre: number;                // Semestre académico (1 al 9)
  categoria: string;               // 'Guías' | 'Apuntes' | 'Prácticas' | 'Proyectos'
  parcial?: number | null;         // Parcial 1, 2 o 3 si aplica
  carpetaId?: number | null;       // Carpeta en la que está organizado
  autorNombre: string;             // Nombre del alumno o docente que subió el archivo
  autorRol: string;                // Rol institucional (Estudiante, Profesor, Administrador)
  docenteId?: number;              // ID del docente propietario
  descargas: number;               // Contador de descargas
  fechaSubida: string;             // Fecha ISO de subida
  fechaActualizacion: string;      // Fecha ISO de última modificación
  isBookmarked?: boolean;          // Indica si el estudiante actual lo guardó
}
