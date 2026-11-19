import { PrismaClient, EstadoCuenta } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando siembra de datos oficial INFOUAQ...');

  // 1. ROLES ACTIVOS INSTITUCIONALES (ESTUDIANTE, PROFESOR, ADMINISTRADOR)
  const roles = [
    { id: 1, nombre: 'ESTUDIANTE', descripcion: 'Consulta materias, descarga materiales y comenta dentro de los archivos.' },
    { id: 2, nombre: 'PROFESOR', descripcion: 'Administra materias asignadas, crea carpetas y sube documentos oficiales.' },
    { id: 3, nombre: 'ADMINISTRADOR', descripcion: 'Gestiona usuarios institucionales, materias y modera contenido reportado.' },
  ];

  for (const r of roles) {
    await prisma.rol.upsert({
      where: { id: r.id },
      update: { nombre: r.nombre, descripcion: r.descripcion },
      create: r,
    });
  }
  console.log('Roles oficiales listos.');

  // 2. LAS 7 CARRERAS OFICIALES DE LA FACULTAD DE INFORMÁTICA
  const carreras = [
    { clave: 'INF18',  nombre: 'Licenciatura en Informática', creditos: 312 },
    { clave: 'LAT18',  nombre: 'Licenciatura en Administración de Tecnologías de Información', creditos: 312 },
    { clave: 'SOF18',  nombre: 'Ingeniería de Software', creditos: 312 },
    { clave: 'INC18',  nombre: 'Ingeniería en Computación', creditos: 312 },
    { clave: 'TEL18',  nombre: 'Ingeniería en Telecomunicaciones y Redes', creditos: 312 },
    { clave: 'CAD22',  nombre: 'Ingeniería en Ciencia y Analítica de Datos', creditos: 325 },
    { clave: 'ITIC22', nombre: 'Ingeniería en Tecnologías de Información y Ciberseguridad', creditos: 312 },
  ];

  const carreraMap = new Map<string, number>();
  for (const c of carreras) {
    const saved = await prisma.carrera.upsert({
      where: { clave: c.clave },
      update: { nombre: c.nombre, creditos: c.creditos },
      create: c,
    });
    carreraMap.set(c.clave, saved.id);
  }
  console.log('7 Carreras oficiales listas.');

  // 3. LAS 12 ÁREAS DE CONOCIMIENTO OFICIALES
  const areas = [
    { id: 1,  nombre: 'Entorno Social' },
    { id: 2,  nombre: 'Matemáticas' },
    { id: 3,  nombre: 'Arquitectura de las Computadoras' },
    { id: 4,  nombre: 'Tratamiento de la Información' },
    { id: 5,  nombre: 'Redes' },
    { id: 6,  nombre: 'Interacción Hombre-Máquina' },
    { id: 7,  nombre: 'Software de Base' },
    { id: 8,  nombre: 'Programación e Ingeniería de Software' },
    { id: 9,  nombre: 'Formación Universitaria' },
    { id: 10, nombre: 'Inglés' },
    { id: 11, nombre: 'Tópico' },
    { id: 12, nombre: 'Prácticas Profesionales' },
  ];

  for (const a of areas) {
    await prisma.areaConocimiento.upsert({
      where: { id: a.id },
      update: { nombre: a.nombre },
      create: a,
    });
  }
  console.log('12 Áreas de conocimiento listas.');

  // 4. PERIODO ACADÉMICO ACTIVO
  const periodo = await prisma.periodo.upsert({
    where: { nombre: '2026-2' },
    update: { activo: true },
    create: {
      nombre: '2026-2',
      fecha_inicio: new Date('2026-08-01'),
      fecha_fin: new Date('2026-12-15'),
      activo: true,
    },
  });
  console.log('Periodo activo listo (2026-2).');

  // 5. USUARIOS BASE DE PRUEBA
  const defaultPasswordHash = bcrypt.hashSync('Uaq2026!', 10);
  const inf18Id = carreraMap.get('INF18');

  // Estudiante
  const estudiante = await prisma.usuario.upsert({
    where: { correo: 'ana.martinez@alumnos.uaq.mx' },
    update: { password_hash: defaultPasswordHash, rol_id: 1, carrera_id: inf18Id, semestre: 6 },
    create: {
      correo: 'ana.martinez@alumnos.uaq.mx',
      password_hash: defaultPasswordHash,
      nombre: 'Ana',
      apellidos: 'Martínez Delgado',
      rol_id: 1, // ESTUDIANTE
      estado: EstadoCuenta.ACTIVA,
      carrera_id: inf18Id,
      semestre: 6,
    },
  });

  // Profesor
  const profesor = await prisma.usuario.upsert({
    where: { correo: 'carlos.ramirez@uaq.mx' },
    update: { password_hash: defaultPasswordHash, rol_id: 2 },
    create: {
      correo: 'carlos.ramirez@uaq.mx',
      password_hash: defaultPasswordHash,
      nombre: 'Carlos',
      apellidos: 'Ramírez Peña',
      rol_id: 2, // PROFESOR
      estado: EstadoCuenta.ACTIVA,
    },
  });

  // Administrador
  await prisma.usuario.upsert({
    where: { correo: 'fernando.morales@uaq.mx' },
    update: { password_hash: defaultPasswordHash, rol_id: 3 },
    create: {
      correo: 'fernando.morales@uaq.mx',
      password_hash: defaultPasswordHash,
      nombre: 'Fernando',
      apellidos: 'Morales Aguilar',
      rol_id: 3, // ADMINISTRADOR
      estado: EstadoCuenta.ACTIVA,
    },
  });
  console.log('Usuarios base institucionales listos.');

  // 6. CATÁLOGO COMPLETO DE MATERIAS OFICIALES (SECCIÓN 6)
  interface MateriaSeed {
    clave: string;
    nombre: string;
    areaId: number;
    asignaciones: { carreraClave: string; semestre: number }[];
  }

  const materiasData: MateriaSeed[] = [
    // -------------------------------------------------------------
    // A. MATERIAS COMPARTIDAS (TRONCO COMÚN)
    // -------------------------------------------------------------
    {
      clave: '2001', nombre: 'Administración', areaId: 1,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 1 }, { carreraClave: 'LAT18', semestre: 1 },
        { carreraClave: 'SOF18', semestre: 1 }, { carreraClave: 'INC18', semestre: 1 },
        { carreraClave: 'TEL18', semestre: 1 }, { carreraClave: 'CAD22', semestre: 1 },
        { carreraClave: 'ITIC22', semestre: 1 },
      ],
    },
    {
      clave: '2002', nombre: 'Introducción a las Tecnologías de Información', areaId: 3,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 1 }, { carreraClave: 'LAT18', semestre: 1 },
        { carreraClave: 'SOF18', semestre: 1 }, { carreraClave: 'INC18', semestre: 1 },
        { carreraClave: 'TEL18', semestre: 1 }, { carreraClave: 'CAD22', semestre: 1 },
        { carreraClave: 'ITIC22', semestre: 1 },
      ],
    },
    {
      clave: '2003', nombre: 'Ética y Legislación Informática', areaId: 1,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 1 }, { carreraClave: 'LAT18', semestre: 1 },
        { carreraClave: 'SOF18', semestre: 1 }, { carreraClave: 'INC18', semestre: 1 },
        { carreraClave: 'TEL18', semestre: 1 }, { carreraClave: 'CAD22', semestre: 1 },
        { carreraClave: 'ITIC22', semestre: 1 },
      ],
    },
    {
      clave: '2004', nombre: 'Matemáticas Computacionales', areaId: 2,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 1 }, { carreraClave: 'LAT18', semestre: 1 },
        { carreraClave: 'SOF18', semestre: 1 }, { carreraClave: 'INC18', semestre: 1 },
        { carreraClave: 'TEL18', semestre: 1 }, { carreraClave: 'CAD22', semestre: 1 },
        { carreraClave: 'ITIC22', semestre: 1 },
      ],
    },
    {
      clave: '2005', nombre: 'Introducción a la Programación', areaId: 8,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 1 }, { carreraClave: 'LAT18', semestre: 1 },
        { carreraClave: 'SOF18', semestre: 1 }, { carreraClave: 'INC18', semestre: 1 },
        { carreraClave: 'TEL18', semestre: 1 }, { carreraClave: 'CAD22', semestre: 1 },
        { carreraClave: 'ITIC22', semestre: 1 },
      ],
    },
    {
      clave: '2006', nombre: 'Desarrollo Humano I', areaId: 9,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 1 }, { carreraClave: 'LAT18', semestre: 1 },
        { carreraClave: 'SOF18', semestre: 1 }, { carreraClave: 'INC18', semestre: 1 },
        { carreraClave: 'TEL18', semestre: 1 }, { carreraClave: 'CAD22', semestre: 1 },
        { carreraClave: 'ITIC22', semestre: 1 },
      ],
    },
    {
      clave: '2007', nombre: 'Introducción a la Investigación', areaId: 9,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 1 }, { carreraClave: 'LAT18', semestre: 1 },
        { carreraClave: 'SOF18', semestre: 1 }, { carreraClave: 'INC18', semestre: 1 },
        { carreraClave: 'TEL18', semestre: 1 }, { carreraClave: 'CAD22', semestre: 1 },
        { carreraClave: 'ITIC22', semestre: 1 },
      ],
    },
    {
      clave: '2008', nombre: 'Deportes I', areaId: 9,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 1 }, { carreraClave: 'LAT18', semestre: 1 },
        { carreraClave: 'SOF18', semestre: 1 }, { carreraClave: 'INC18', semestre: 1 },
        { carreraClave: 'TEL18', semestre: 1 }, { carreraClave: 'CAD22', semestre: 1 },
        { carreraClave: 'ITIC22', semestre: 1 },
      ],
    },
    {
      clave: '2009', nombre: 'Diseño de Interfaces de Software', areaId: 6,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 2 }, { carreraClave: 'LAT18', semestre: 2 },
        { carreraClave: 'SOF18', semestre: 2 }, { carreraClave: 'INC18', semestre: 2 },
      ],
    },
    {
      clave: '2011', nombre: 'Cálculo Diferencial e Integral', areaId: 2,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 2 }, { carreraClave: 'LAT18', semestre: 2 },
        { carreraClave: 'INC18', semestre: 2 }, { carreraClave: 'TEL18', semestre: 2 },
      ],
    },
    {
      clave: '2012', nombre: 'Álgebra Lineal', areaId: 2,
      asignaciones: [
        { carreraClave: 'SOF18', semestre: 2 }, { carreraClave: 'INC18', semestre: 2 },
        { carreraClave: 'TEL18', semestre: 2 }, { carreraClave: 'CAD22', semestre: 2 },
        { carreraClave: 'ITIC22', semestre: 2 },
      ],
    },
    {
      clave: '2014', nombre: 'Desarrollo Humano II', areaId: 9,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 2 }, { carreraClave: 'LAT18', semestre: 2 },
        { carreraClave: 'SOF18', semestre: 2 }, { carreraClave: 'INC18', semestre: 2 },
        { carreraClave: 'TEL18', semestre: 2 }, { carreraClave: 'CAD22', semestre: 2 },
        { carreraClave: 'ITIC22', semestre: 2 },
      ],
    },
    {
      clave: '2015', nombre: 'Inglés I', areaId: 10,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 2 }, { carreraClave: 'LAT18', semestre: 2 },
        { carreraClave: 'SOF18', semestre: 2 }, { carreraClave: 'INC18', semestre: 2 },
        { carreraClave: 'TEL18', semestre: 2 }, { carreraClave: 'CAD22', semestre: 2 },
        { carreraClave: 'ITIC22', semestre: 2 },
      ],
    },
    {
      clave: '2016', nombre: 'Deportes II', areaId: 9,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 2 }, { carreraClave: 'LAT18', semestre: 2 },
        { carreraClave: 'SOF18', semestre: 2 }, { carreraClave: 'INC18', semestre: 2 },
        { carreraClave: 'TEL18', semestre: 2 }, { carreraClave: 'CAD22', semestre: 2 },
        { carreraClave: 'ITIC22', semestre: 2 },
      ],
    },
    {
      clave: '2019', nombre: 'Probabilidad y Estadística', areaId: 2,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 3 }, { carreraClave: 'LAT18', semestre: 3 },
        { carreraClave: 'INC18', semestre: 3 }, { carreraClave: 'TEL18', semestre: 3 },
        { carreraClave: 'ITIC22', semestre: 4 },
      ],
    },
    {
      clave: '2020', nombre: 'Cálculo Vectorial', areaId: 2,
      asignaciones: [
        { carreraClave: 'INC18', semestre: 3 }, { carreraClave: 'TEL18', semestre: 3 },
      ],
    },
    {
      clave: '2021', nombre: 'Algoritmos y Estructura de Datos', areaId: 8,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 3 }, { carreraClave: 'LAT18', semestre: 3 },
        { carreraClave: 'INC18', semestre: 3 }, { carreraClave: 'TEL18', semestre: 3 },
        { carreraClave: 'ITIC22', semestre: 3 },
      ],
    },
    {
      clave: '2022', nombre: 'Desarrollo Humano III', areaId: 9,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 3 }, { carreraClave: 'LAT18', semestre: 3 },
        { carreraClave: 'SOF18', semestre: 3 }, { carreraClave: 'INC18', semestre: 3 },
        { carreraClave: 'TEL18', semestre: 3 }, { carreraClave: 'CAD22', semestre: 3 },
        { carreraClave: 'ITIC22', semestre: 3 },
      ],
    },
    {
      clave: '2023', nombre: 'Inglés II', areaId: 10,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 3 }, { carreraClave: 'LAT18', semestre: 3 },
        { carreraClave: 'SOF18', semestre: 3 }, { carreraClave: 'INC18', semestre: 3 },
        { carreraClave: 'TEL18', semestre: 3 }, { carreraClave: 'CAD22', semestre: 3 },
        { carreraClave: 'ITIC22', semestre: 3 },
      ],
    },
    {
      clave: '2024', nombre: 'Deportes III', areaId: 9,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 3 }, { carreraClave: 'LAT18', semestre: 3 },
        { carreraClave: 'SOF18', semestre: 3 }, { carreraClave: 'INC18', semestre: 3 },
        { carreraClave: 'TEL18', semestre: 3 }, { carreraClave: 'CAD22', semestre: 3 },
        { carreraClave: 'ITIC22', semestre: 3 },
      ],
    },
    {
      clave: '2027', nombre: 'Sistemas Operativos (5 cr.)', areaId: 7,
      asignaciones: [
        { carreraClave: 'LAT18', semestre: 4 }, { carreraClave: 'INC18', semestre: 4 },
        { carreraClave: 'TEL18', semestre: 4 }, { carreraClave: 'CAD22', semestre: 4 },
        { carreraClave: 'ITIC22', semestre: 2 },
      ],
    },
    {
      clave: '2028', nombre: 'Ecuaciones Diferenciales', areaId: 2,
      asignaciones: [
        { carreraClave: 'INC18', semestre: 4 }, { carreraClave: 'TEL18', semestre: 4 },
        { carreraClave: 'CAD22', semestre: 3 },
      ],
    },
    {
      clave: '2031', nombre: 'Inglés III', areaId: 10,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 4 }, { carreraClave: 'LAT18', semestre: 4 },
        { carreraClave: 'SOF18', semestre: 4 }, { carreraClave: 'INC18', semestre: 4 },
        { carreraClave: 'TEL18', semestre: 4 }, { carreraClave: 'CAD22', semestre: 4 },
        { carreraClave: 'ITIC22', semestre: 4 },
      ],
    },
    {
      clave: '2034', nombre: 'Administración de Sistemas Operativos', areaId: 7,
      asignaciones: [
        { carreraClave: 'LAT18', semestre: 5 }, { carreraClave: 'INC18', semestre: 5 },
      ],
    },
    {
      clave: '2035', nombre: 'Series y Transformadas de Fourier', areaId: 2,
      asignaciones: [
        { carreraClave: 'INC18', semestre: 5 }, { carreraClave: 'TEL18', semestre: 5 },
      ],
    },
    {
      clave: '2038', nombre: 'Inglés IV', areaId: 10,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 5 }, { carreraClave: 'LAT18', semestre: 5 },
        { carreraClave: 'SOF18', semestre: 5 }, { carreraClave: 'INC18', semestre: 5 },
        { carreraClave: 'TEL18', semestre: 5 }, { carreraClave: 'CAD22', semestre: 5 },
        { carreraClave: 'ITIC22', semestre: 5 },
      ],
    },
    {
      clave: '2044', nombre: 'Inglés V', areaId: 10,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 6 }, { carreraClave: 'LAT18', semestre: 6 },
        { carreraClave: 'SOF18', semestre: 6 }, { carreraClave: 'INC18', semestre: 6 },
        { carreraClave: 'TEL18', semestre: 6 }, { carreraClave: 'CAD22', semestre: 6 },
        { carreraClave: 'ITIC22', semestre: 6 },
      ],
    },
    {
      clave: '2046', nombre: 'Tópico I', areaId: 11,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 7 }, { carreraClave: 'LAT18', semestre: 7 },
        { carreraClave: 'SOF18', semestre: 7 }, { carreraClave: 'INC18', semestre: 7 },
        { carreraClave: 'TEL18', semestre: 7 }, { carreraClave: 'CAD22', semestre: 7 },
        { carreraClave: 'ITIC22', semestre: 6 },
      ],
    },
    {
      clave: '2049', nombre: 'Inglés VI', areaId: 10,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 7 }, { carreraClave: 'LAT18', semestre: 7 },
        { carreraClave: 'SOF18', semestre: 7 }, { carreraClave: 'INC18', semestre: 7 },
        { carreraClave: 'TEL18', semestre: 7 }, { carreraClave: 'CAD22', semestre: 7 },
        { carreraClave: 'ITIC22', semestre: 7 },
      ],
    },
    {
      clave: '2051', nombre: 'Tópico II', areaId: 11,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 8 }, { carreraClave: 'LAT18', semestre: 8 },
        { carreraClave: 'SOF18', semestre: 8 }, { carreraClave: 'INC18', semestre: 8 },
        { carreraClave: 'TEL18', semestre: 8 }, { carreraClave: 'CAD22', semestre: 8 },
        { carreraClave: 'ITIC22', semestre: 7 },
      ],
    },
    {
      clave: '2052', nombre: 'Gestión de las TI', areaId: 1,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 8 }, { carreraClave: 'LAT18', semestre: 8 },
        { carreraClave: 'SOF18', semestre: 8 }, { carreraClave: 'INC18', semestre: 8 },
      ],
    },
    {
      clave: '2053', nombre: 'Servicio Social', areaId: 9,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 8 }, { carreraClave: 'LAT18', semestre: 8 },
        { carreraClave: 'SOF18', semestre: 8 }, { carreraClave: 'INC18', semestre: 8 },
        { carreraClave: 'TEL18', semestre: 8 }, { carreraClave: 'CAD22', semestre: 8 },
        { carreraClave: 'ITIC22', semestre: 8 },
      ],
    },
    {
      clave: '2054', nombre: 'Prácticas Profesionales', areaId: 12,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 9 }, { carreraClave: 'LAT18', semestre: 9 },
        { carreraClave: 'SOF18', semestre: 9 }, { carreraClave: 'INC18', semestre: 9 },
        { carreraClave: 'TEL18', semestre: 9 }, { carreraClave: 'CAD22', semestre: 9 },
        { carreraClave: 'ITIC22', semestre: 9 },
      ],
    },
    {
      clave: '2055', nombre: 'Contabilidad Financiera', areaId: 1,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 2 }, { carreraClave: 'SOF18', semestre: 2 },
      ],
    },
    {
      clave: '2056', nombre: 'Principios de Electrónica y Circuitos Lógicos', areaId: 3,
      asignaciones: [
        { carreraClave: 'LAT18', semestre: 2 }, { carreraClave: 'SOF18', semestre: 2 },
        { carreraClave: 'ITIC22', semestre: 2 },
      ],
    },
    {
      clave: '2057', nombre: 'Programación Orientada a Objetos', areaId: 8,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 2 }, { carreraClave: 'LAT18', semestre: 2 },
        { carreraClave: 'SOF18', semestre: 2 }, { carreraClave: 'TEL18', semestre: 2 },
        { carreraClave: 'CAD22', semestre: 2 }, { carreraClave: 'ITIC22', semestre: 2 },
      ],
    },
    {
      clave: '2058', nombre: 'Redes I', areaId: 5,
      asignaciones: [
        { carreraClave: 'SOF18', semestre: 3 }, { carreraClave: 'TEL18', semestre: 3 },
      ],
    },
    {
      clave: '2063', nombre: 'Redes II', areaId: 5,
      asignaciones: [
        { carreraClave: 'SOF18', semestre: 4 }, { carreraClave: 'TEL18', semestre: 4 },
      ],
    },
    {
      clave: '2064', nombre: 'Desarrollo de Sistemas en Internet', areaId: 8,
      asignaciones: [
        { carreraClave: 'SOF18', semestre: 4 }, { carreraClave: 'TEL18', semestre: 4 },
      ],
    },
    {
      clave: '2073', nombre: 'Administración de Base de Datos', areaId: 4,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 5 }, { carreraClave: 'LAT18', semestre: 5 },
        { carreraClave: 'SOF18', semestre: 5 }, { carreraClave: 'ITIC22', semestre: 4 },
      ],
    },
    {
      clave: '2074', nombre: 'Sistemas Operativos (6 cr.)', areaId: 7,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 5 }, { carreraClave: 'SOF18', semestre: 5 },
      ],
    },
    {
      clave: '2104', nombre: 'Gestión de Recursos Humanos', areaId: 1,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 2 }, { carreraClave: 'LAT18', semestre: 2 },
      ],
    },
    {
      clave: '2107', nombre: 'Análisis y Diseño de Sistemas de Información', areaId: 4,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 3 }, { carreraClave: 'LAT18', semestre: 3 },
      ],
    },
    {
      clave: '2109', nombre: 'Ingeniería de Requerimientos', areaId: 8,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 4 }, { carreraClave: 'LAT18', semestre: 4 },
      ],
    },
    {
      clave: '2111', nombre: 'Base de Datos', areaId: 4,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 4 }, { carreraClave: 'LAT18', semestre: 4 },
        { carreraClave: 'CAD22', semestre: 4 },
      ],
    },
    {
      clave: '2112', nombre: 'Introducción a las Redes', areaId: 5,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 4 }, { carreraClave: 'LAT18', semestre: 4 },
      ],
    },
    {
      clave: '2116', nombre: 'Ruteo y Conmutación Básicos', areaId: 5,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 5 }, { carreraClave: 'LAT18', semestre: 5 },
      ],
    },
    {
      clave: '2118', nombre: 'Virtualización', areaId: 7,
      asignaciones: [
        { carreraClave: 'INF18', semestre: 6 }, { carreraClave: 'LAT18', semestre: 6 },
      ],
    },

    // -------------------------------------------------------------
    // B. INF18 (Licenciatura en Informática)
    // -------------------------------------------------------------
    { clave: '2126', nombre: 'Administración de la Cadena de Suministros', areaId: 1, asignaciones: [{ carreraClave: 'INF18', semestre: 3 }] },
    { clave: '2127', nombre: 'Finanzas Corporativas', areaId: 1, asignaciones: [{ carreraClave: 'INF18', semestre: 3 }] },
    { clave: '2128', nombre: 'Planeación y Programación Detallada de Recursos', areaId: 1, asignaciones: [{ carreraClave: 'INF18', semestre: 4 }] },
    { clave: '2129', nombre: 'Estadística Inferencial', areaId: 2, asignaciones: [{ carreraClave: 'INF18', semestre: 4 }] },
    { clave: '2130', nombre: 'Principios de Electrónica y Circuitos Lógicos (INF)', areaId: 3, asignaciones: [{ carreraClave: 'INF18', semestre: 4 }] },
    { clave: '2131', nombre: 'Gestión Estratégica de Operaciones y Recursos', areaId: 1, asignaciones: [{ carreraClave: 'INF18', semestre: 5 }] },
    { clave: '2140', nombre: 'Desarrollo de Sistemas en Internet (INF)', areaId: 8, asignaciones: [{ carreraClave: 'INF18', semestre: 5 }] },
    { clave: '2132', nombre: 'Aplicaciones Empresariales', areaId: 4, asignaciones: [{ carreraClave: 'INF18', semestre: 5 }] },
    { clave: '2133', nombre: 'Marketing', areaId: 1, asignaciones: [{ carreraClave: 'INF18', semestre: 6 }] },
    { clave: '2134', nombre: 'Administración de Redes (INF)', areaId: 5, asignaciones: [{ carreraClave: 'INF18', semestre: 6 }] },
    { clave: '2135', nombre: 'Programación de Apps', areaId: 8, asignaciones: [{ carreraClave: 'INF18', semestre: 6 }] },
    { clave: '2136', nombre: 'Big Data y Sistemas de Base de Datos No Relacionales', areaId: 4, asignaciones: [{ carreraClave: 'INF18', semestre: 6 }] },
    { clave: '2137', nombre: 'Administración de Proyectos Informáticos', areaId: 1, asignaciones: [{ carreraClave: 'INF18', semestre: 7 }] },
    { clave: '2138', nombre: 'Inteligencia Artificial (INF)', areaId: 6, asignaciones: [{ carreraClave: 'INF18', semestre: 7 }] },
    { clave: '2139', nombre: 'Inteligencia de Negocios I', areaId: 4, asignaciones: [{ carreraClave: 'INF18', semestre: 7 }] },
    { clave: '2141', nombre: 'Inteligencia de Negocios II', areaId: 4, asignaciones: [{ carreraClave: 'INF18', semestre: 8 }] },

    // -------------------------------------------------------------
    // C. LAT18 (Licenciatura en Administración de Tecnologías de Información)
    // -------------------------------------------------------------
    { clave: '2105', nombre: 'Contabilidad Financiera (LAT)', areaId: 1, asignaciones: [{ carreraClave: 'LAT18', semestre: 3 }] },
    { clave: '2108', nombre: 'Sistemas Básicos, Arquitectura y Procesamiento (LAT)', areaId: 3, asignaciones: [{ carreraClave: 'LAT18', semestre: 3 }] },
    { clave: '2106', nombre: 'Administración Estratégica', areaId: 1, asignaciones: [{ carreraClave: 'LAT18', semestre: 4 }] },
    { clave: '2110', nombre: 'Análisis de Datos para la Toma de Decisiones', areaId: 2, asignaciones: [{ carreraClave: 'LAT18', semestre: 4 }] },
    { clave: '2113', nombre: 'TI y Estrategias de Negocios', areaId: 1, asignaciones: [{ carreraClave: 'LAT18', semestre: 5 }] },
    { clave: '2114', nombre: 'Programación con Acceso a Datos', areaId: 8, asignaciones: [{ carreraClave: 'LAT18', semestre: 5 }] },
    { clave: '2115', nombre: 'Inteligencia Artificial (LAT)', areaId: 6, asignaciones: [{ carreraClave: 'LAT18', semestre: 5 }] },
    { clave: '2117', nombre: 'Liderazgo Estratégico', areaId: 1, asignaciones: [{ carreraClave: 'LAT18', semestre: 6 }] },
    { clave: '2119', nombre: 'Desarrollo de Sistemas en Internet (LAT)', areaId: 8, asignaciones: [{ carreraClave: 'LAT18', semestre: 6 }] },
    { clave: '2120', nombre: 'Sistemas para la Toma de Decisiones', areaId: 4, asignaciones: [{ carreraClave: 'LAT18', semestre: 6 }] },
    { clave: '2121', nombre: 'Telefonía IP', areaId: 5, asignaciones: [{ carreraClave: 'LAT18', semestre: 6 }] },
    { clave: '2122', nombre: 'Administración de Proyectos de TI', areaId: 1, asignaciones: [{ carreraClave: 'LAT18', semestre: 7 }] },
    { clave: '2123', nombre: 'Fundamentos de Cloud Computing', areaId: 7, asignaciones: [{ carreraClave: 'LAT18', semestre: 7 }] },
    { clave: '2124', nombre: 'Big Data y Sistemas No Relacionales (LAT)', areaId: 4, asignaciones: [{ carreraClave: 'LAT18', semestre: 7 }] },
    { clave: '2125', nombre: 'Hackeo Ético', areaId: 5, asignaciones: [{ carreraClave: 'LAT18', semestre: 8 }] },

    // -------------------------------------------------------------
    // D. SOF18 (Ingeniería de Software)
    // -------------------------------------------------------------
    { clave: '2059', nombre: 'Ingeniería de Requerimientos (SOF)', areaId: 8, asignaciones: [{ carreraClave: 'SOF18', semestre: 3 }] },
    { clave: '2060', nombre: 'Algoritmos', areaId: 8, asignaciones: [{ carreraClave: 'SOF18', semestre: 3 }] },
    { clave: '2061', nombre: 'Cálculo Diferencial e Integral (SOF)', areaId: 2, asignaciones: [{ carreraClave: 'SOF18', semestre: 3 }] },
    { clave: '2062', nombre: 'Base de Datos I', areaId: 4, asignaciones: [{ carreraClave: 'SOF18', semestre: 3 }] },
    { clave: '2065', nombre: 'Estructuras de Datos', areaId: 8, asignaciones: [{ carreraClave: 'SOF18', semestre: 4 }] },
    { clave: '2066', nombre: 'Teoría de la Computación', areaId: 2, asignaciones: [{ carreraClave: 'SOF18', semestre: 4 }] },
    { clave: '2067', nombre: 'Base de Datos II', areaId: 4, asignaciones: [{ carreraClave: 'SOF18', semestre: 4 }] },
    { clave: '2068', nombre: 'Análisis y Diseño de Software', areaId: 4, asignaciones: [{ carreraClave: 'SOF18', semestre: 4 }] },
    { clave: '2069', nombre: 'Diseño y Soporte de Redes de Computadoras', areaId: 5, asignaciones: [{ carreraClave: 'SOF18', semestre: 5 }] },
    { clave: '2070', nombre: 'Sistemas Básicos, Arquitectura y Procesamiento (SOF)', areaId: 3, asignaciones: [{ carreraClave: 'SOF18', semestre: 5 }] },
    { clave: '2071', nombre: 'Sistemas Distribuidos', areaId: 8, asignaciones: [{ carreraClave: 'SOF18', semestre: 5 }] },
    { clave: '2072', nombre: 'Frameworks y Arquitecturas de Software', areaId: 8, asignaciones: [{ carreraClave: 'SOF18', semestre: 5 }] },
    { clave: '2075', nombre: 'Inteligencia Artificial (SOF)', areaId: 6, asignaciones: [{ carreraClave: 'SOF18', semestre: 6 }] },
    { clave: '2076', nombre: 'Desarrollo de Aplicaciones Móviles', areaId: 8, asignaciones: [{ carreraClave: 'SOF18', semestre: 6 }] },
    { clave: '2077', nombre: 'Aplicaciones de Big Data', areaId: 4, asignaciones: [{ carreraClave: 'SOF18', semestre: 6 }] },
    { clave: '2078', nombre: 'Servicios Cloud', areaId: 7, asignaciones: [{ carreraClave: 'SOF18', semestre: 6 }] },
    { clave: '2079', nombre: 'Administración de Proyectos de Software', areaId: 1, asignaciones: [{ carreraClave: 'SOF18', semestre: 7 }] },
    { clave: '2080', nombre: 'Sistemas Inmersivos y de Realidad Aumentada', areaId: 6, asignaciones: [{ carreraClave: 'SOF18', semestre: 7 }] },
    { clave: '2081', nombre: 'Pruebas y Aseguramiento de la Calidad del Software', areaId: 8, asignaciones: [{ carreraClave: 'SOF18', semestre: 7 }] },
    { clave: '2082', nombre: 'Inteligencia de Negocios', areaId: 4, asignaciones: [{ carreraClave: 'SOF18', semestre: 7 }] },
    { clave: '2083', nombre: 'Arquitecturas de TI Empresariales', areaId: 4, asignaciones: [{ carreraClave: 'SOF18', semestre: 8 }] },

    // -------------------------------------------------------------
    // E. INC18 (Ingeniería en Computación)
    // -------------------------------------------------------------
    { clave: '2010', nombre: 'Principios de Electrónica', areaId: 3, asignaciones: [{ carreraClave: 'INC18', semestre: 2 }] },
    { clave: '2013', nombre: 'Programación de Sistemas Embebidos', areaId: 8, asignaciones: [{ carreraClave: 'INC18', semestre: 2 }] },
    { clave: '2017', nombre: 'Análisis y Diseño de Sistemas Computacionales', areaId: 4, asignaciones: [{ carreraClave: 'INC18', semestre: 3 }] },
    { clave: '2018', nombre: 'Electrónica Analógica y Digital', areaId: 3, asignaciones: [{ carreraClave: 'INC18', semestre: 3 }] },
    { clave: '2025', nombre: 'Fundamentos de Redes', areaId: 5, asignaciones: [{ carreraClave: 'INC18', semestre: 4 }] },
    { clave: '2026', nombre: 'Lógica Digital', areaId: 3, asignaciones: [{ carreraClave: 'INC18', semestre: 4 }] },
    { clave: '2029', nombre: 'Programación de Bajo Nivel', areaId: 8, asignaciones: [{ carreraClave: 'INC18', semestre: 4 }] },
    { clave: '2030', nombre: 'Interconectividad de Dispositivos', areaId: 6, asignaciones: [{ carreraClave: 'INC18', semestre: 4 }] },
    { clave: '2032', nombre: 'Protocolos de Ruteo', areaId: 5, asignaciones: [{ carreraClave: 'INC18', semestre: 5 }] },
    { clave: '2033', nombre: 'Sistemas Digitales', areaId: 3, asignaciones: [{ carreraClave: 'INC18', semestre: 5 }] },
    { clave: '2036', nombre: 'Instrumentación Virtual', areaId: 8, asignaciones: [{ carreraClave: 'INC18', semestre: 5 }] },
    { clave: '2037', nombre: 'Dispositivos Programables', areaId: 6, asignaciones: [{ carreraClave: 'INC18', semestre: 5 }] },
    { clave: '2039', nombre: 'Administración y Seguridad de Redes', areaId: 5, asignaciones: [{ carreraClave: 'INC18', semestre: 6 }] },
    { clave: '2040', nombre: 'Sistemas de Propósito General', areaId: 3, asignaciones: [{ carreraClave: 'INC18', semestre: 6 }] },
    { clave: '2041', nombre: 'Arquitecturas de Modelos Cloud', areaId: 7, asignaciones: [{ carreraClave: 'INC18', semestre: 6 }] },
    { clave: '2042', nombre: 'Desarrollo con Sistemas Mínimos', areaId: 8, asignaciones: [{ carreraClave: 'INC18', semestre: 6 }] },
    { clave: '2043', nombre: 'Recuperación de la Información y Base de Datos (INC)', areaId: 4, asignaciones: [{ carreraClave: 'INC18', semestre: 6 }] },
    { clave: '2045', nombre: 'Protocolos de Comunicación', areaId: 5, asignaciones: [{ carreraClave: 'INC18', semestre: 7 }] },
    { clave: '2047', nombre: 'Administración de Proyectos de Computación', areaId: 1, asignaciones: [{ carreraClave: 'INC18', semestre: 7 }] },
    { clave: '2048', nombre: 'Sistemas de Tiempo Real', areaId: 8, asignaciones: [{ carreraClave: 'INC18', semestre: 7 }] },
    { clave: '2050', nombre: 'Inteligencia Artificial (INC)', areaId: 6, asignaciones: [{ carreraClave: 'INC18', semestre: 8 }] },

    // -------------------------------------------------------------
    // F. TEL18 (Ingeniería en Telecomunicaciones y Redes)
    // -------------------------------------------------------------
    { clave: '2084', nombre: 'Fundamentos de Comunicaciones', areaId: 5, asignaciones: [{ carreraClave: 'TEL18', semestre: 2 }] },
    { clave: '2085', nombre: 'Electricidad y Magnetismo', areaId: 3, asignaciones: [{ carreraClave: 'TEL18', semestre: 2 }] },
    { clave: '2086', nombre: 'Circuitos Eléctricos', areaId: 3, asignaciones: [{ carreraClave: 'TEL18', semestre: 3 }] },
    { clave: '2088', nombre: 'Recuperación de la Información y Base de Datos (TEL)', areaId: 4, asignaciones: [{ carreraClave: 'TEL18', semestre: 4 }] },
    { clave: '2087', nombre: 'Comunicaciones Electrónicas', areaId: 3, asignaciones: [{ carreraClave: 'TEL18', semestre: 4 }] },
    { clave: '2090', nombre: 'Redes III', areaId: 5, asignaciones: [{ carreraClave: 'TEL18', semestre: 5 }] },
    { clave: '2089', nombre: 'Telefonía', areaId: 5, asignaciones: [{ carreraClave: 'TEL18', semestre: 5 }] },
    { clave: '2091', nombre: 'Antenas', areaId: 5, asignaciones: [{ carreraClave: 'TEL18', semestre: 5 }] },
    { clave: '2092', nombre: 'Nuevos Paradigmas Tecnológicos', areaId: 3, asignaciones: [{ carreraClave: 'TEL18', semestre: 5 }] },
    { clave: '2093', nombre: 'Regulación de las Telecomunicaciones', areaId: 7, asignaciones: [{ carreraClave: 'TEL18', semestre: 5 }] },
    { clave: '2094', nombre: 'Redes IV', areaId: 5, asignaciones: [{ carreraClave: 'TEL18', semestre: 6 }] },
    { clave: '2097', nombre: 'Sistemas de Comunicaciones Móviles', areaId: 5, asignaciones: [{ carreraClave: 'TEL18', semestre: 6 }] },
    { clave: '2095', nombre: 'Comunicaciones Ópticas', areaId: 5, asignaciones: [{ carreraClave: 'TEL18', semestre: 6 }] },
    { clave: '2096', nombre: 'Sistemas de Modulación', areaId: 3, asignaciones: [{ carreraClave: 'TEL18', semestre: 6 }] },
    { clave: '2098', nombre: 'Telemetría', areaId: 6, asignaciones: [{ carreraClave: 'TEL18', semestre: 6 }] },
    { clave: '2099', nombre: 'Seguridad en Redes', areaId: 5, asignaciones: [{ carreraClave: 'TEL18', semestre: 7 }] },
    { clave: '2100', nombre: 'Líneas de Transmisión', areaId: 5, asignaciones: [{ carreraClave: 'TEL18', semestre: 7 }] },
    { clave: '2101', nombre: 'Circuitos de Radio Frecuencia', areaId: 3, asignaciones: [{ carreraClave: 'TEL18', semestre: 7 }] },
    { clave: '2103', nombre: 'Proyectos de Telecomunicaciones', areaId: 5, asignaciones: [{ carreraClave: 'TEL18', semestre: 8 }] },
    { clave: '2102', nombre: 'Comunicaciones Satelitales', areaId: 5, asignaciones: [{ carreraClave: 'TEL18', semestre: 8 }] },

    // -------------------------------------------------------------
    // G. CAD22 (Ingeniería en Ciencia y Analítica de Datos)
    // -------------------------------------------------------------
    { clave: '2150', nombre: 'Metodología de la Investigación y Divulgación', areaId: 1, asignaciones: [{ carreraClave: 'CAD22', semestre: 2 }] },
    { clave: '2151', nombre: 'Sistemas Digitales e Interfaces de Hardware', areaId: 3, asignaciones: [{ carreraClave: 'CAD22', semestre: 2 }] },
    { clave: '2152', nombre: 'Cálculo', areaId: 2, asignaciones: [{ carreraClave: 'CAD22', semestre: 2 }] },
    { clave: '2153', nombre: 'Inteligencia Artificial (CAD)', areaId: 4, asignaciones: [{ carreraClave: 'CAD22', semestre: 3 }] },
    { clave: '2154', nombre: 'Arquitectura de Sistemas', areaId: 3, asignaciones: [{ carreraClave: 'CAD22', semestre: 3 }] },
    { clave: '2156', nombre: 'Estructuras de Datos y Modelos Discretos', areaId: 8, asignaciones: [{ carreraClave: 'CAD22', semestre: 3 }] },
    { clave: '2155', nombre: 'Diseño de Algoritmos', areaId: 8, asignaciones: [{ carreraClave: 'CAD22', semestre: 3 }] },
    { clave: '2157', nombre: 'Herramientas para Ciencia de Datos', areaId: 7, asignaciones: [{ carreraClave: 'CAD22', semestre: 4 }] },
    { clave: '2158', nombre: 'Teoría de la Probabilidad', areaId: 2, asignaciones: [{ carreraClave: 'CAD22', semestre: 4 }] },
    { clave: '2159', nombre: 'Teoría de la Información', areaId: 8, asignaciones: [{ carreraClave: 'CAD22', semestre: 4 }] },
    { clave: '2160', nombre: 'Visualización y Despliegue de Datos', areaId: 6, asignaciones: [{ carreraClave: 'CAD22', semestre: 4 }] },
    { clave: '2161', nombre: 'Administración de Proyectos (CAD)', areaId: 1, asignaciones: [{ carreraClave: 'CAD22', semestre: 5 }] },
    { clave: '2162', nombre: 'Modelos Predictivos', areaId: 4, asignaciones: [{ carreraClave: 'CAD22', semestre: 5 }] },
    { clave: '2163', nombre: 'Sistemas Dinámicos', areaId: 2, asignaciones: [{ carreraClave: 'CAD22', semestre: 5 }] },
    { clave: '2164', nombre: 'Redes y Arquitecturas Convergentes', areaId: 5, asignaciones: [{ carreraClave: 'CAD22', semestre: 5 }] },
    { clave: '2165', nombre: 'Repositorios y Centros de Datos Distribuidos', areaId: 7, asignaciones: [{ carreraClave: 'CAD22', semestre: 5 }] },
    { clave: '2166', nombre: 'Instrumentación y Sensores para IoT', areaId: 6, asignaciones: [{ carreraClave: 'CAD22', semestre: 5 }] },
    { clave: '2167', nombre: 'Emprendimiento Empresarial', areaId: 1, asignaciones: [{ carreraClave: 'CAD22', semestre: 6 }] },
    { clave: '2168', nombre: 'Aprendizaje Máquina', areaId: 4, asignaciones: [{ carreraClave: 'CAD22', semestre: 6 }] },
    { clave: '2170', nombre: 'Minería de Datos', areaId: 4, asignaciones: [{ carreraClave: 'CAD22', semestre: 6 }] },
    { clave: '2169', nombre: 'Infraestructura y Servicios de la Nube', areaId: 7, asignaciones: [{ carreraClave: 'CAD22', semestre: 6 }] },
    { clave: '2171', nombre: 'Seguridad de la Información', areaId: 8, asignaciones: [{ carreraClave: 'CAD22', semestre: 6 }] },
    { clave: '2172', nombre: 'Implementación de Sistemas Interoperables', areaId: 6, asignaciones: [{ carreraClave: 'CAD22', semestre: 6 }] },
    { clave: '2173', nombre: 'Diseño y Desarrollo de Proyectos para la Industria 4.0', areaId: 1, asignaciones: [{ carreraClave: 'CAD22', semestre: 7 }] },
    { clave: '2174', nombre: 'Análisis de Datos no Estructurados y Minería de Textos', areaId: 4, asignaciones: [{ carreraClave: 'CAD22', semestre: 7 }] },
    { clave: '2175', nombre: 'Sistemas Distribuidos Tolerantes a Fallos', areaId: 5, asignaciones: [{ carreraClave: 'CAD22', semestre: 7 }] },
    { clave: '2176', nombre: 'Análisis y Pronóstico de Series Temporales', areaId: 7, asignaciones: [{ carreraClave: 'CAD22', semestre: 8 }] },
    { clave: '2177', nombre: 'Big Data y Analítica de Datos', areaId: 4, asignaciones: [{ carreraClave: 'CAD22', semestre: 8 }] },

    // -------------------------------------------------------------
    // H. ITIC22 (Ingeniería en Tecnologías de Información y Ciberseguridad)
    // -------------------------------------------------------------
    { clave: '2201', nombre: 'Seguridad Humana', areaId: 1, asignaciones: [{ carreraClave: 'ITIC22', semestre: 2 }] },
    { clave: '2202', nombre: 'Fundamentos de Redes (ITIC)', areaId: 5, asignaciones: [{ carreraClave: 'ITIC22', semestre: 3 }] },
    { clave: '2203', nombre: 'Automatización y Administración de Sistemas Operativos', areaId: 7, asignaciones: [{ carreraClave: 'ITIC22', semestre: 3 }] },
    { clave: '2204', nombre: 'Cálculo (ITIC)', areaId: 2, asignaciones: [{ carreraClave: 'ITIC22', semestre: 3 }] },
    { clave: '2205', nombre: 'Introducción a las Bases de Datos', areaId: 4, asignaciones: [{ carreraClave: 'ITIC22', semestre: 3 }] },
    { clave: '2206', nombre: 'Protocolos de Ruteo y Conmutación', areaId: 5, asignaciones: [{ carreraClave: 'ITIC22', semestre: 4 }] },
    { clave: '2207', nombre: 'Arquitectura de Computadoras y HPFS', areaId: 3, asignaciones: [{ carreraClave: 'ITIC22', semestre: 4 }] },
    { clave: '2208', nombre: 'Desarrollo Web', areaId: 8, asignaciones: [{ carreraClave: 'ITIC22', semestre: 4 }] },
    { clave: '2209', nombre: 'Servicios Cloud (ITIC)', areaId: 7, asignaciones: [{ carreraClave: 'ITIC22', semestre: 4 }] },
    { clave: '2210', nombre: 'Administración de Redes (ITIC)', areaId: 5, asignaciones: [{ carreraClave: 'ITIC22', semestre: 5 }] },
    { clave: '2211', nombre: 'Introducción a la Ciberseguridad en Redes', areaId: 5, asignaciones: [{ carreraClave: 'ITIC22', semestre: 5 }] },
    { clave: '2212', nombre: 'Seguridad en el Software', areaId: 8, asignaciones: [{ carreraClave: 'ITIC22', semestre: 5 }] },
    { clave: '2213', nombre: 'Matemáticas para Ciberseguridad', areaId: 2, asignaciones: [{ carreraClave: 'ITIC22', semestre: 5 }] },
    { clave: '2214', nombre: 'Integración de Datos', areaId: 4, asignaciones: [{ carreraClave: 'ITIC22', semestre: 5 }] },
    { clave: '2215', nombre: 'Seguridad Organizacional', areaId: 1, asignaciones: [{ carreraClave: 'ITIC22', semestre: 5 }] },
    { clave: '2216', nombre: 'Seguridad Cloud', areaId: 5, asignaciones: [{ carreraClave: 'ITIC22', semestre: 6 }] },
    { clave: '2217', nombre: 'Analítica de Seguridad de Datos', areaId: 4, asignaciones: [{ carreraClave: 'ITIC22', semestre: 6 }] },
    { clave: '2218', nombre: 'Seguridad Social', areaId: 1, asignaciones: [{ carreraClave: 'ITIC22', semestre: 6 }] },
    { clave: '2219', nombre: 'Seguridad de Redes Avanzado', areaId: 5, asignaciones: [{ carreraClave: 'ITIC22', semestre: 7 }] },
    { clave: '2220', nombre: 'Hardening de Servidores', areaId: 7, asignaciones: [{ carreraClave: 'ITIC22', semestre: 7 }] },
    { clave: '2221', nombre: 'Herramientas de Inteligencia Artificial', areaId: 6, asignaciones: [{ carreraClave: 'ITIC22', semestre: 7 }] },
    { clave: '2222', nombre: 'Administración de Proyectos (ITIC)', areaId: 1, asignaciones: [{ carreraClave: 'ITIC22', semestre: 7 }] },
    { clave: '2223', nombre: 'Operaciones de Ciberseguridad', areaId: 5, asignaciones: [{ carreraClave: 'ITIC22', semestre: 8 }] },
    { clave: '2224', nombre: 'Cómputo Forense', areaId: 6, asignaciones: [{ carreraClave: 'ITIC22', semestre: 8 }] },
    { clave: '2225', nombre: 'Tópico III', areaId: 11, asignaciones: [{ carreraClave: 'ITIC22', semestre: 8 }] },
  ];

  console.log(`Insertando ${materiasData.length} materias oficiales y sus relaciones...`);

  let countRelaciones = 0;
  for (const m of materiasData) {
    const materiaGuardada = await prisma.materia.upsert({
      where: { clave: m.clave },
      update: {
        nombre: m.nombre,
        area_id: m.areaId,
        activa: true,
      },
      create: {
        clave: m.clave,
        nombre: m.nombre,
        area_id: m.areaId,
        activa: true,
      },
    });

    for (const asig of m.asignaciones) {
      const carreraId = carreraMap.get(asig.carreraClave);
      if (carreraId) {
        await prisma.materiasCarrera.upsert({
          where: {
            materia_id_carrera_id: {
              materia_id: materiaGuardada.id,
              carrera_id: carreraId,
            },
          },
          update: { semestre: asig.semestre },
          create: {
            materia_id: materiaGuardada.id,
            carrera_id: carreraId,
            semestre: asig.semestre,
          },
        });
        countRelaciones++;
      }
    }
  }

  console.log(`${materiasData.length} materias procesadas con ${countRelaciones} asignaciones a carreras.`);

  // 7. ASIGNACIÓN DE DOCENTE EN EL PERIODO ACTIVO (Carlos Ramírez Peña)
  const materiasAsignadasProfesor = ['2005', '2021', '2057', '2111', '2208'];
  for (const claveMat of materiasAsignadasProfesor) {
    const mat = await prisma.materia.findUnique({ where: { clave: claveMat } });
    if (mat) {
      await prisma.materiasProfesor.upsert({
        where: {
          materia_id_profesor_id_periodo_id: {
            materia_id: mat.id,
            profesor_id: profesor.id,
            periodo_id: periodo.id,
          },
        },
        update: {},
        create: {
          materia_id: mat.id,
          profesor_id: profesor.id,
          periodo_id: periodo.id,
        },
      });

      // Crear carpetas base de muestra del docente en estas materias
      const carpetaU1 = await prisma.carpeta.findFirst({
        where: { materia_id: mat.id, propietario_id: profesor.id, nombre: 'Unidad 1: Fundamentos y Conceptos' },
      });
      if (!carpetaU1) {
        await prisma.carpeta.create({
          data: {
            nombre: 'Unidad 1: Fundamentos y Conceptos',
            materia_id: mat.id,
            propietario_id: profesor.id,
          },
        });
      }

      const carpetaGuias = await prisma.carpeta.findFirst({
        where: { materia_id: mat.id, propietario_id: profesor.id, nombre: 'Guías de Estudio Oficiales' },
      });
      if (!carpetaGuias) {
        await prisma.carpeta.create({
          data: {
            nombre: 'Guías de Estudio Oficiales',
            materia_id: mat.id,
            propietario_id: profesor.id,
          },
        });
      }
    }
  }

  console.log('Asignaciones de profesor y carpetas oficiales listas.');
  console.log('Siembra oficial finalizada con éxito.');
}

main()
  .catch((e) => {
    console.error('Error durante la siembra:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
