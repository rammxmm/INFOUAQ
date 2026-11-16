/**
 * Modelo de datos de un Documento Académico en INFOUAQ
 * Esta estructura servirá como base directa para la tabla de PostgreSQL en Prisma
 */
export interface AcademicFile {
  id: string;                      // Identificador único UUID
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
  semestre: number;                // Semestre académico (1 al 8)
  categoria: string;               // 'Guías' | 'Apuntes' | 'Prácticas' | 'Proyectos'
  autorNombre: string;             // Nombre del alumno o docente que subió el archivo
  autorRol: string;                // Rol institucional (Estudiante, Profesor, Administrador)
  descargas: number;               // Contador de descargas
  fechaSubida: string;             // Fecha ISO de subida
  fechaActualizacion: string;      // Fecha ISO de última modificación
}
