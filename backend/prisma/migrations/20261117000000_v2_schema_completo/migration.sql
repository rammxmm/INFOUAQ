-- CreateEnum
CREATE TYPE "EstadoCuenta" AS ENUM ('ACTIVA', 'INACTIVA', 'SUSPENDIDA');

-- CreateEnum
CREATE TYPE "EstadoArchivo" AS ENUM ('PUBLICADO', 'EN_REVISION', 'OCULTO');

-- CreateEnum
CREATE TYPE "EstadoComentario" AS ENUM ('VISIBLE', 'OCULTO', 'ELIMINADO');

-- CreateEnum
CREATE TYPE "EstadoReporte" AS ENUM ('PENDIENTE', 'DESCARTADO', 'CONFIRMADO');

-- CreateEnum
CREATE TYPE "EstadoRevision" AS ENUM ('PENDIENTE', 'APROBADO', 'OBSERVADO');

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carreras" (
    "id" SERIAL NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "creditos" INTEGER,

    CONSTRAINT "carreras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas_conocimiento" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "areas_conocimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periodos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3),
    "fecha_fin" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "periodos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "correo" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "rol_id" INTEGER NOT NULL,
    "estado" "EstadoCuenta" NOT NULL DEFAULT 'ACTIVA',
    "carrera_id" INTEGER,
    "semestre" INTEGER,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimo_acceso" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_recuperacion" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "usado_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_recuperacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materias" (
    "id" SERIAL NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "area_id" INTEGER,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materias_carreras" (
    "materia_id" INTEGER NOT NULL,
    "carrera_id" INTEGER NOT NULL,
    "semestre" INTEGER NOT NULL,

    CONSTRAINT "materias_carreras_pkey" PRIMARY KEY ("materia_id","carrera_id")
);

-- CreateTable
CREATE TABLE "materias_profesores" (
    "materia_id" INTEGER NOT NULL,
    "profesor_id" INTEGER NOT NULL,
    "periodo_id" INTEGER NOT NULL,

    CONSTRAINT "materias_profesores_pkey" PRIMARY KEY ("materia_id","profesor_id","periodo_id")
);

-- CreateTable
CREATE TABLE "carpetas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "materia_id" INTEGER NOT NULL,
    "propietario_id" INTEGER NOT NULL,
    "padre_id" INTEGER,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carpetas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archivos" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "tema" TEXT,
    "parcial" INTEGER,
    "nombre_original" TEXT NOT NULL,
    "ruta_almacen" TEXT NOT NULL,
    "tamano_bytes" BIGINT NOT NULL,
    "mime_type" TEXT NOT NULL DEFAULT 'application/pdf',
    "estado" "EstadoArchivo" NOT NULL DEFAULT 'PUBLICADO',
    "materia_id" INTEGER NOT NULL,
    "docente_id" INTEGER NOT NULL,
    "carpeta_id" INTEGER,
    "descargas" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "archivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentarios" (
    "id" SERIAL NOT NULL,
    "archivo_id" INTEGER NOT NULL,
    "autor_id" INTEGER NOT NULL,
    "padre_id" INTEGER,
    "contenido" TEXT NOT NULL,
    "estado" "EstadoComentario" NOT NULL DEFAULT 'VISIBLE',
    "editado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentarios_likes" (
    "comentario_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comentarios_likes_pkey" PRIMARY KEY ("comentario_id","usuario_id")
);

-- CreateTable
CREATE TABLE "reportes_comentarios" (
    "id" SERIAL NOT NULL,
    "comentario_id" INTEGER NOT NULL,
    "reportante_id" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "estado" "EstadoReporte" NOT NULL DEFAULT 'PENDIENTE',
    "resuelto_por_id" INTEGER,
    "resuelto_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reportes_comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supervision_areas" (
    "usuario_id" INTEGER NOT NULL,
    "area_id" INTEGER NOT NULL,

    CONSTRAINT "supervision_areas_pkey" PRIMARY KEY ("usuario_id","area_id")
);

-- CreateTable
CREATE TABLE "revisiones_archivos" (
    "id" SERIAL NOT NULL,
    "archivo_id" INTEGER NOT NULL,
    "revisor_id" INTEGER NOT NULL,
    "estado" "EstadoRevision" NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revisiones_archivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bitacora_auditoria" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" INTEGER,
    "detalle" JSONB,
    "ip" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bitacora_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "carreras_clave_key" ON "carreras"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "areas_conocimiento_nombre_key" ON "areas_conocimiento"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "periodos_nombre_key" ON "periodos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE INDEX "usuarios_rol_id_idx" ON "usuarios"("rol_id");

-- CreateIndex
CREATE INDEX "usuarios_carrera_id_idx" ON "usuarios"("carrera_id");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_recuperacion_token_hash_key" ON "tokens_recuperacion"("token_hash");

-- CreateIndex
CREATE INDEX "tokens_recuperacion_usuario_id_idx" ON "tokens_recuperacion"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "materias_clave_key" ON "materias"("clave");

-- CreateIndex
CREATE INDEX "materias_area_id_idx" ON "materias"("area_id");

-- CreateIndex
CREATE INDEX "materias_carreras_carrera_semestre_idx" ON "materias_carreras"("carrera_id", "semestre");

-- CreateIndex
CREATE INDEX "materias_profesores_profesor_id_idx" ON "materias_profesores"("profesor_id");

-- CreateIndex
CREATE INDEX "carpetas_materia_propietario_idx" ON "carpetas"("materia_id", "propietario_id");

-- CreateIndex
CREATE INDEX "archivos_materia_id_idx" ON "archivos"("materia_id");

-- CreateIndex
CREATE INDEX "archivos_docente_id_idx" ON "archivos"("docente_id");

-- CreateIndex
CREATE INDEX "archivos_carpeta_id_idx" ON "archivos"("carpeta_id");

-- CreateIndex
CREATE INDEX "comentarios_archivo_id_idx" ON "comentarios"("archivo_id");

-- CreateIndex
CREATE INDEX "comentarios_padre_id_idx" ON "comentarios"("padre_id");

-- CreateIndex
CREATE INDEX "reportes_comentarios_estado_idx" ON "reportes_comentarios"("estado");

-- CreateIndex
CREATE INDEX "revisiones_archivos_archivo_id_idx" ON "revisiones_archivos"("archivo_id");

-- CreateIndex
CREATE INDEX "bitacora_auditoria_usuario_id_idx" ON "bitacora_auditoria"("usuario_id");

-- CreateIndex
CREATE INDEX "bitacora_auditoria_entidad_idx" ON "bitacora_auditoria"("entidad", "entidad_id");

-- CreateIndex
CREATE INDEX "bitacora_auditoria_creado_en_idx" ON "bitacora_auditoria"("creado_en");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_carrera_id_fkey" FOREIGN KEY ("carrera_id") REFERENCES "carreras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens_recuperacion" ADD CONSTRAINT "tokens_recuperacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materias" ADD CONSTRAINT "materias_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas_conocimiento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materias_carreras" ADD CONSTRAINT "materias_carreras_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materias_carreras" ADD CONSTRAINT "materias_carreras_carrera_id_fkey" FOREIGN KEY ("carrera_id") REFERENCES "carreras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materias_profesores" ADD CONSTRAINT "materias_profesores_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materias_profesores" ADD CONSTRAINT "materias_profesores_profesor_id_fkey" FOREIGN KEY ("profesor_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materias_profesores" ADD CONSTRAINT "materias_profesores_periodo_id_fkey" FOREIGN KEY ("periodo_id") REFERENCES "periodos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carpetas" ADD CONSTRAINT "carpetas_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carpetas" ADD CONSTRAINT "carpetas_propietario_id_fkey" FOREIGN KEY ("propietario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carpetas" ADD CONSTRAINT "carpetas_padre_id_fkey" FOREIGN KEY ("padre_id") REFERENCES "carpetas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archivos" ADD CONSTRAINT "archivos_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archivos" ADD CONSTRAINT "archivos_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archivos" ADD CONSTRAINT "archivos_carpeta_id_fkey" FOREIGN KEY ("carpeta_id") REFERENCES "carpetas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_archivo_id_fkey" FOREIGN KEY ("archivo_id") REFERENCES "archivos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_padre_id_fkey" FOREIGN KEY ("padre_id") REFERENCES "comentarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_likes" ADD CONSTRAINT "comentarios_likes_comentario_id_fkey" FOREIGN KEY ("comentario_id") REFERENCES "comentarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_likes" ADD CONSTRAINT "comentarios_likes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_comentarios" ADD CONSTRAINT "reportes_comentarios_comentario_id_fkey" FOREIGN KEY ("comentario_id") REFERENCES "comentarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_comentarios" ADD CONSTRAINT "reportes_comentarios_reportante_id_fkey" FOREIGN KEY ("reportante_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_comentarios" ADD CONSTRAINT "reportes_comentarios_resuelto_por_id_fkey" FOREIGN KEY ("resuelto_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervision_areas" ADD CONSTRAINT "supervision_areas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervision_areas" ADD CONSTRAINT "supervision_areas_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas_conocimiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisiones_archivos" ADD CONSTRAINT "revisiones_archivos_archivo_id_fkey" FOREIGN KEY ("archivo_id") REFERENCES "archivos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisiones_archivos" ADD CONSTRAINT "revisiones_archivos_revisor_id_fkey" FOREIGN KEY ("revisor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacora_auditoria" ADD CONSTRAINT "bitacora_auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

