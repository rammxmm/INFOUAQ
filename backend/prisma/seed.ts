import { PrismaClient, EstadoCuenta } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando siembra de datos (seed)...');

  // 1. Roles institucionales
  const roles = [
    { id: 1, nombre: 'Estudiante', descripcion: 'Consulta materias, descarga materiales y comenta dentro de los archivos.' },
    { id: 2, nombre: 'Profesor', descripcion: 'Administra materias asignadas y sube documentos oficiales.' },
    { id: 3, nombre: 'Administrador', descripcion: 'Gestiona usuarios institucionales, materias y modera contenido reportado.' },
  ];

  for (const r of roles) {
    await prisma.rol.upsert({
      where: { id: r.id },
      update: { nombre: r.nombre, descripcion: r.descripcion },
      create: r,
    });
  }
  console.log('Roles listos.');

  // 2. Carreras oficiales de la Facultad de Informática UAQ
  const carreras = [
    { clave: 'ITIC22', nombre: 'Ingeniería en Tecnologías de Información y Ciberseguridad', creditos: 350 },
    { clave: 'CAD22',  nombre: 'Licenciatura en Ciencias del Aprendizaje y Desarrollo', creditos: 320 },
    { clave: 'TEL18',  nombre: 'Ingeniería en Telecomunicaciones y Redes', creditos: 360 },
    { clave: 'INC18',  nombre: 'Ingeniería en Computación', creditos: 380 },
    { clave: 'SOF18',  nombre: 'Ingeniería de Software', creditos: 360 },
    { clave: 'LAT18',  nombre: 'Licenciatura en Administración de Tecnologías de Información', creditos: 340 },
    { clave: 'INF18',  nombre: 'Licenciatura en Informática', creditos: 350 },
  ];

  for (const c of carreras) {
    await prisma.carrera.upsert({
      where: { clave: c.clave },
      update: { nombre: c.nombre, creditos: c.creditos },
      create: c,
    });
  }
  console.log('Carreras listas.');

  // 3. Áreas de conocimiento
  const areas = [
    'Ciencias de la Computación',
    'Ingeniería de Software',
    'Redes y Telecomunicaciones',
    'Sistemas de Información',
    'Matemáticas y Ciencias Básicas',
  ];

  for (const nombre of areas) {
    await prisma.areaConocimiento.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }
  console.log('Áreas de conocimiento listas.');

  // 4. Periodos académicos
  const periodo = await prisma.periodo.upsert({
    where: { nombre: '2026-1' },
    update: { activo: true },
    create: {
      nombre: '2026-1',
      fecha_inicio: new Date('2026-01-15'),
      fecha_fin: new Date('2026-06-15'),
      activo: true,
    },
  });
  console.log('Periodo activo listo.');

  // 5. Usuarios base institucionales (perfiles de la plataforma)
  const inf18 = await prisma.carrera.findUnique({ where: { clave: 'INF18' } });
  const defaultPasswordHash = bcrypt.hashSync('Uaq2026!', 10);

  // Estudiante
  const estudiante = await prisma.usuario.upsert({
    where: { correo: 'ana.martinez@alumnos.uaq.mx' },
    update: { password_hash: defaultPasswordHash },
    create: {
      correo: 'ana.martinez@alumnos.uaq.mx',
      password_hash: defaultPasswordHash,
      nombre: 'Ana',
      apellidos: 'Martínez Delgado',
      rol_id: 1, // Estudiante
      estado: EstadoCuenta.ACTIVA,
      carrera_id: inf18?.id,
      semestre: 6,
    },
  });

  // Profesor
  const profesor = await prisma.usuario.upsert({
    where: { correo: 'carlos.ramirez@uaq.mx' },
    update: { password_hash: defaultPasswordHash },
    create: {
      correo: 'carlos.ramirez@uaq.mx',
      password_hash: defaultPasswordHash,
      nombre: 'Carlos',
      apellidos: 'Ramírez Peña',
      rol_id: 2, // Profesor
      estado: EstadoCuenta.ACTIVA,
    },
  });

  // Administrador
  await prisma.usuario.upsert({
    where: { correo: 'fernando.morales@uaq.mx' },
    update: { password_hash: defaultPasswordHash },
    create: {
      correo: 'fernando.morales@uaq.mx',
      password_hash: defaultPasswordHash,
      nombre: 'Fernando',
      apellidos: 'Morales Aguilar',
      rol_id: 3, // Administrador
      estado: EstadoCuenta.ACTIVA,
    },
  });
  console.log('Usuarios base listos.');

  // 6. Materias del catálogo y vinculación con carreras y profesores
  const areaIS = await prisma.areaConocimiento.findUnique({ where: { nombre: 'Ingeniería de Software' } });
  const areaCC = await prisma.areaConocimiento.findUnique({ where: { nombre: 'Ciencias de la Computación' } });

  const progWeb = await prisma.materia.upsert({
    where: { clave: 'IS-301' },
    update: { nombre: 'Programación Web' },
    create: {
      clave: 'IS-301',
      nombre: 'Programación Web',
      descripcion: 'Fundamentos de cliente-servidor, componentes web, APIs REST y TypeScript.',
      area_id: areaIS?.id,
      activa: true,
    },
  });

  const baseDatos = await prisma.materia.upsert({
    where: { clave: 'IS-302' },
    update: { nombre: 'Base de Datos' },
    create: {
      clave: 'IS-302',
      nombre: 'Base de Datos',
      descripcion: 'Diseño relacional, normalización, modelado entidad-relación y lenguaje SQL.',
      area_id: areaCC?.id,
      activa: true,
    },
  });

  // Vinculación de materias a carreras
  const todasCarreras = await prisma.carrera.findMany();
  for (const c of todasCarreras) {
    await prisma.materiasCarrera.upsert({
      where: { materia_id_carrera_id: { materia_id: progWeb.id, carrera_id: c.id } },
      update: { semestre: 3 },
      create: { materia_id: progWeb.id, carrera_id: c.id, semestre: 3 },
    });
    await prisma.materiasCarrera.upsert({
      where: { materia_id_carrera_id: { materia_id: baseDatos.id, carrera_id: c.id } },
      update: { semestre: 3 },
      create: { materia_id: baseDatos.id, carrera_id: c.id, semestre: 3 },
    });
  }

  // Vinculación de materia con profesor en periodo
  await prisma.materiasProfesor.upsert({
    where: {
      materia_id_profesor_id_periodo_id: {
        materia_id: progWeb.id,
        profesor_id: profesor.id,
        periodo_id: periodo.id,
      },
    },
    update: {},
    create: {
      materia_id: progWeb.id,
      profesor_id: profesor.id,
      periodo_id: periodo.id,
    },
  });

  console.log('Materias y asignaciones listas.');
  console.log('Siembra de datos finalizada con éxito.');
}

main()
  .catch((e) => {
    console.error('Error durante la siembra de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
