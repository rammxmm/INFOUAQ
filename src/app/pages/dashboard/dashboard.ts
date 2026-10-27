import { Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type UserRole = 'Estudiante' | 'Profesor' | 'Administrador';

export interface UserProfile {
  name: string;
  initials: string;
  role: UserRole;
  expediente: string;
  email: string;
  carreraOrDept: string;
  semestreOrCargo: string;
  campus: string;
}

export interface DocumentComment {
  id: string;
  authorName: string;
  authorInitials: string;
  authorRole: UserRole;
  authorExpediente: string;
  timestamp: string;
  content: string;
  likes: number;
  userLiked: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
  isReported?: boolean;
  reportReason?: string;
  replies?: DocumentComment[];
}

export interface AcademicDocument {
  id: string;
  name: string;
  subject: string;
  subjectCode: string;
  type: 'PDF' | 'PPTX' | 'DOCX' | 'ZIP';
  date: string;
  color: string;
  size: string;
  unit: string;
  category: 'Guías' | 'Apuntes' | 'Prácticas' | 'Proyectos';
  downloads: number;
  author: string;
  description: string;
  comments: DocumentComment[];
}

export interface Subject {
  name: string;
  code: string;
  teacher: string;
  progress: number;
  semester: number;
  units: {
    name: string;
    description: string;
    materialIds: string[];
  }[];
}

export interface InstitutionalUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'Activo' | 'Inactivo';
  expediente: string;
  registrationDate: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  logout = output<void>();

  // Navegación principal
  activeView:
    | 'Inicio'
    | 'Materias'
    | 'Repositorio'
    | 'Detalle Documento'
    | 'Panel Docente'
    | 'Panel Administrador'
    | 'Mi Perfil' = 'Inicio';

  previousView: typeof this.activeView = 'Inicio';

  // Notificaciones y alertas
  actionFeedback: string | null = null;

  // Catálogo de Perfiles para Simulación Institucional
  profiles: Record<UserRole, UserProfile> = {
    Estudiante: {
      name: 'Ana Martínez Delgado',
      initials: 'AM',
      role: 'Estudiante',
      expediente: '298412',
      email: 'ana.martinez@alumnos.uaq.mx',
      carreraOrDept: 'Licenciatura en Informática (Plan 2020)',
      semestreOrCargo: '6° Semestre',
      campus: 'Centro Universitario UAQ',
    },
    Profesor: {
      name: 'Mtro. Carlos Ramírez Peña',
      initials: 'CR',
      role: 'Profesor',
      expediente: 'DOC-1044',
      email: 'carlos.ramirez@uaq.mx',
      carreraOrDept: 'Área de Ciencias de la Computación',
      semestreOrCargo: 'Profesor Titular de Asignatura',
      campus: 'Facultad de Informática',
    },
    Administrador: {
      name: 'Lic. Fernando Morales Aguilar',
      initials: 'FM',
      role: 'Administrador',
      expediente: 'ADM-0042',
      email: 'fernando.morales@uaq.mx',
      carreraOrDept: 'Coordinación Administrativa y Sistemas',
      semestreOrCargo: 'Administrador de Plataforma INFOUAQ',
      campus: 'Centro Universitario UAQ',
    },
  };

  currentRole: UserRole = 'Estudiante';
  currentUser: UserProfile = this.profiles['Estudiante'];

  // Búsqueda en Inicio
  searchTerm = '';
  activeTab: 'Recientes' | 'Consultados' | 'Materias' = 'Recientes';

  // Catálogo de materias
  selectedSubject: Subject | null = null;
  subjectSearch = '';
  selectedSemester = 'Todos';
  selectedStatus = 'Todas';

  // Repositorio de documentos
  repoSearch = '';
  selectedRepoSubject = 'Todas';
  selectedRepoType = 'Todos';
  selectedRepoCategory = 'Todas';
  repoViewMode: 'list' | 'grid' = 'list';

  // Pantalla de Detalle de Documento (con comentarios integrados)
  selectedDocument: AcademicDocument | null = null;
  newCommentText = '';
  replyingCommentId: string | null = null;
  replyText = '';
  editingCommentId: string | null = null;
  editCommentText = '';

  // Modal de Reporte de Comentarios
  reportingComment: DocumentComment | null = null;
  selectedReportReason = 'Contenido fuera de contexto académico';

  // Modal de Subir / Sustituir Material
  isUploadModalOpen = false;
  uploadTitle = '';
  uploadSubject = 'Programación Web';
  uploadUnit = 'Unidad 1: Arquitectura Web y Protocolos HTTP';
  uploadCategory: 'Guías' | 'Apuntes' | 'Prácticas' | 'Proyectos' = 'Guías';
  uploadDescription = '';
  uploadFileName = '';
  uploadFileSize = '';
  uploadFormError = '';

  // Base de datos simulada: Documentos académicos con comentarios permanentes
  documents: AcademicDocument[] = [
    {
      id: 'doc-1',
      name: 'Introducción a Angular y Componentes Standalone.pdf',
      subject: 'Programación Web',
      subjectCode: 'IS-301',
      type: 'PDF',
      date: '02 oct. 2026',
      color: 'pdf',
      size: '3.4 MB',
      unit: 'Unidad 1',
      category: 'Guías',
      downloads: 48,
      author: 'Mtro. Carlos Ramírez Peña',
      description:
        'Guía técnica institucional sobre arquitectura orientada a componentes, directivas estructurales y servicios en Angular.',
      comments: [
        {
          id: 'c-1',
          authorName: 'Mtro. Carlos Ramírez Peña',
          authorInitials: 'CR',
          authorRole: 'Profesor',
          authorExpediente: 'DOC-1044',
          timestamp: '03 oct. 2026, 09:15',
          content:
            'Estimados estudiantes: para la práctica de la próxima semana, tomen como referencia fundamental el diagrama de ciclo de vida de la página 8.',
          likes: 12,
          userLiked: false,
          replies: [
            {
              id: 'c-1-1',
              authorName: 'Ana Martínez Delgado',
              authorInitials: 'AM',
              authorRole: 'Estudiante',
              authorExpediente: '298412',
              timestamp: '03 oct. 2026, 11:40',
              content:
                'Profesor, en el caso de standalone components, ¿es necesario importar CommonModule en cada componente o es preferible importar directivas individuales?',
              likes: 4,
              userLiked: false,
            },
            {
              id: 'c-1-2',
              authorName: 'Mtro. Carlos Ramírez Peña',
              authorInitials: 'CR',
              authorRole: 'Profesor',
              authorExpediente: 'DOC-1044',
              timestamp: '03 oct. 2026, 12:20',
              content:
                'Excelente pregunta, Ana. En las versiones modernas de Angular se recomienda importar directivas específicas para optimizar el árbol de dependencias, aunque CommonModule es válido en prototipos.',
              likes: 7,
              userLiked: false,
            },
          ],
        },
        {
          id: 'c-2',
          authorName: 'Jorge Luis Morales',
          authorInitials: 'JM',
          authorRole: 'Estudiante',
          authorExpediente: '304118',
          timestamp: '05 oct. 2026, 16:30',
          content:
            '¿Alguien tiene problemas con la versión de Node al compilar? Con Node 22 me arrojó una advertencia de paquetes.',
          likes: 2,
          userLiked: false,
          replies: [
            {
              id: 'c-2-1',
              authorName: 'Ana Martínez Delgado',
              authorInitials: 'AM',
              authorRole: 'Estudiante',
              authorExpediente: '298412',
              timestamp: '05 oct. 2026, 17:05',
              content:
                'Jorge, verifica tener instalada la versión LTS 20 o 22.2 activa; con esa compila sin incompatibilidad.',
              likes: 3,
              userLiked: false,
            },
          ],
        },
      ],
    },
    {
      id: 'doc-2',
      name: 'Modelado Relacional y Formas Normales.pptx',
      subject: 'Base de Datos',
      subjectCode: 'IS-302',
      type: 'PPTX',
      date: '10 oct. 2026',
      color: 'ppt',
      size: '5.8 MB',
      unit: 'Unidad 1',
      category: 'Apuntes',
      downloads: 54,
      author: 'Dra. Laura Méndez García',
      description:
        'Presentación oficial sobre normalización relacional: dependencias funcionales, 1FN, 2FN, 3FN y Boyce-Codd.',
      comments: [
        {
          id: 'c-3',
          authorName: 'Ana Martínez Delgado',
          authorInitials: 'AM',
          authorRole: 'Estudiante',
          authorExpediente: '298412',
          timestamp: '11 oct. 2026, 10:10',
          content:
            'Los ejemplos de la diapositiva 14 sobre dependencias transitivas clarifican muy bien el paso de 2FN a 3FN.',
          likes: 6,
          userLiked: false,
        },
      ],
    },
    {
      id: 'doc-3',
      name: 'Ejercicios de Heurísticas de Usabilidad.docx',
      subject: 'Diseño de Interfaces',
      subjectCode: 'IS-303',
      type: 'DOCX',
      date: '05 oct. 2026',
      color: 'doc',
      size: '1.2 MB',
      unit: 'Unidad 1',
      category: 'Prácticas',
      downloads: 39,
      author: 'Mtro. Diego Torres Morales',
      description:
        'Rúbrica y formato formal de evaluación heurística para sistemas de información universitaria según lineamientos UAQ.',
      comments: [
        {
          id: 'c-4',
          authorName: 'Mtro. Diego Torres Morales',
          authorInitials: 'DT',
          authorRole: 'Profesor',
          authorExpediente: 'DOC-0994',
          timestamp: '06 oct. 2026, 08:30',
          content:
            'Recuerden que la entrega debe justificar cada hallazgo con una propuesta de rediseño basada en la paleta institucional.',
          likes: 8,
          userLiked: false,
        },
      ],
    },
    {
      id: 'doc-4',
      name: 'Guía de Estudio - Examen Parcial 2.pdf',
      subject: 'Estructuras de Datos',
      subjectCode: 'IS-304',
      type: 'PDF',
      date: '12 oct. 2026',
      color: 'pdf',
      size: '2.7 MB',
      unit: 'Unidad 2',
      category: 'Guías',
      downloads: 75,
      author: 'Mtra. Andrea López Silva',
      description:
        'Temario y ejercicios resueltos de balanceo de árboles AVL, recorridos DFS/BFS y matrices de adyacencia.',
      comments: [
        {
          id: 'c-5',
          authorName: 'Valeria Gómez Peña',
          authorInitials: 'VG',
          authorRole: 'Estudiante',
          authorExpediente: '302488',
          timestamp: '13 oct. 2026, 14:15',
          content:
            'El ejercicio 4 de rotación doble a la derecha ayudó bastante a entender el factor de equilibrio.',
          likes: 5,
          userLiked: false,
        },
      ],
    },
  ];

  // Base de datos simulada: Materias
  subjects: Subject[] = [
    {
      name: 'Programación Web',
      code: 'IS-301',
      teacher: 'Mtro. Carlos Ramírez Peña',
      progress: 70,
      semester: 3,
      units: [
        {
          name: 'Unidad 1: Arquitectura Web y Componentes',
          description:
            'Fundamentos de cliente-servidor, componentes standalone y TypeScript.',
          materialIds: ['doc-1'],
        },
      ],
    },
    {
      name: 'Base de Datos',
      code: 'IS-302',
      teacher: 'Dra. Laura Méndez García',
      progress: 40,
      semester: 3,
      units: [
        {
          name: 'Unidad 1: Modelo Relacional y Normalización',
          description:
            'Diseño conceptual y lógico, dependencias funcionales y 3FN.',
          materialIds: ['doc-2'],
        },
      ],
    },
    {
      name: 'Diseño de Interfaces',
      code: 'IS-303',
      teacher: 'Mtro. Diego Torres Morales',
      progress: 85,
      semester: 3,
      units: [
        {
          name: 'Unidad 1: Principios de UX y Sistemas de Diseño',
          description:
            'Heurísticas de usabilidad y manual de identidad visual UAQ.',
          materialIds: ['doc-3'],
        },
      ],
    },
    {
      name: 'Estructuras de Datos',
      code: 'IS-304',
      teacher: 'Mtra. Andrea López Silva',
      progress: 85,
      semester: 3,
      units: [
        {
          name: 'Unidad 2: Árboles y Grafos',
          description:
            'Estructuras no lineales, árboles balanceados y recorridos.',
          materialIds: ['doc-4'],
        },
      ],
    },
  ];

  // Usuarios institucionales para el Panel Administrador
  institutionalUsers: InstitutionalUser[] = [
    {
      id: 'usr-1',
      name: 'Ana Martínez Delgado',
      email: 'ana.martinez@alumnos.uaq.mx',
      role: 'Estudiante',
      status: 'Activo',
      expediente: '298412',
      registrationDate: '12 ago. 2023',
    },
    {
      id: 'usr-2',
      name: 'Mtro. Carlos Ramírez Peña',
      email: 'carlos.ramirez@uaq.mx',
      role: 'Profesor',
      status: 'Activo',
      expediente: 'DOC-1044',
      registrationDate: '01 feb. 2021',
    },
    {
      id: 'usr-3',
      name: 'Dra. Laura Méndez García',
      email: 'laura.mendez@uaq.mx',
      role: 'Profesor',
      status: 'Activo',
      expediente: 'DOC-0982',
      registrationDate: '15 ago. 2019',
    },
    {
      id: 'usr-4',
      name: 'Lic. Fernando Morales Aguilar',
      email: 'fernando.morales@uaq.mx',
      role: 'Administrador',
      status: 'Activo',
      expediente: 'ADM-0042',
      registrationDate: '10 ene. 2018',
    },
    {
      id: 'usr-5',
      name: 'Rodrigo Salinas Pérez',
      email: 'rsalinas@alumnos.uaq.mx',
      role: 'Estudiante',
      status: 'Inactivo',
      expediente: '304910',
      registrationDate: '18 feb. 2024',
    },
  ];

  // Métricas del Panel Administrador
  adminMetrics = {
    totalUsers: '1,240',
    activeStudents: '1,118',
    activeTeachers: '94',
    totalDocuments: '450',
    storageUsed: '12.4 GB',
    storageMax: '100 GB',
  };

  // Avisos institucionales
  notices = [
    {
      title: 'Periodo oficial de evaluaciones parciales — Semestre 2026-2',
      description:
        'Revisa el calendario de exámenes publicado por la Secretaría Académica de la Facultad de Informática.',
      date: '24 oct. 2026',
    },
    {
      title: 'Mantenimiento del Repositorio Académico',
      description:
        'Sincronización de acervos digitales programada para el fin de semana.',
      date: 'Dirección FIF',
    },
  ];

  // Cambio de Rol para Simulación en UI
  switchRole(role: UserRole): void {
    this.currentRole = role;
    this.currentUser = this.profiles[role];

    // Restricción: Si un estudiante está en paneles administrativos, retornar a Inicio
    if (this.currentRole === 'Estudiante') {
      if (
        this.activeView === 'Panel Docente' ||
        this.activeView === 'Panel Administrador'
      ) {
        this.activeView = 'Inicio';
      }
    } else if (this.currentRole === 'Profesor') {
      if (this.activeView === 'Panel Administrador') {
        this.activeView = 'Inicio';
      }
    }

    this.showFeedback(
      `Perfil cambiado a: ${this.currentUser.role} (${this.currentUser.name})`
    );
  }

  // Navegación
  setView(view: typeof this.activeView): void {
    this.previousView = this.activeView;
    this.activeView = view;
    this.selectedSubject = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  logoutRequested(): void {
    this.logout.emit();
  }

  // Navegación a Detalle de Materia
  openSubject(subject: Subject): void {
    this.selectedSubject = subject;
    this.activeView = 'Materias';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  backToSubjects(): void {
    this.selectedSubject = null;
  }

  getDocumentsForUnit(materialIds: string[]): AcademicDocument[] {
    return this.documents.filter((d) => materialIds.includes(d.id));
  }

  // Filtrado de materias
  get filteredSubjects(): Subject[] {
    const term = this.subjectSearch.trim().toLowerCase();

    return this.subjects.filter((subject) => {
      const matchesSearch =
        !term ||
        `${subject.name} ${subject.code} ${subject.teacher}`
          .toLowerCase()
          .includes(term);

      const matchesSemester =
        this.selectedSemester === 'Todos' ||
        subject.semester.toString() === this.selectedSemester;

      const matchesStatus =
        this.selectedStatus === 'Todas' ||
        (this.selectedStatus === 'En progreso' && subject.progress < 100) ||
        (this.selectedStatus === 'Completadas' && subject.progress === 100);

      return matchesSearch && matchesSemester && matchesStatus;
    });
  }

  // Filtrado de Repositorio
  get filteredRepoDocuments(): AcademicDocument[] {
    const term = this.repoSearch.trim().toLowerCase();

    return this.documents.filter((doc) => {
      const matchesSearch =
        !term ||
        `${doc.name} ${doc.subject} ${doc.type} ${doc.author} ${doc.description}`
          .toLowerCase()
          .includes(term);

      const matchesSubject =
        this.selectedRepoSubject === 'Todas' ||
        doc.subject === this.selectedRepoSubject;

      const matchesType =
        this.selectedRepoType === 'Todos' || doc.type === this.selectedRepoType;

      const matchesCategory =
        this.selectedRepoCategory === 'Todas' ||
        doc.category === this.selectedRepoCategory;

      return matchesSearch && matchesSubject && matchesType && matchesCategory;
    });
  }

  // Documentos recientes del Inicio
  get recentDocuments(): AcademicDocument[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.documents.filter(
      (doc) =>
        !term ||
        `${doc.name} ${doc.subject} ${doc.type}`.toLowerCase().includes(term)
    );
  }

  setTab(tab: 'Recientes' | 'Consultados' | 'Materias'): void {
    this.activeTab = tab;
  }

  searchFromHero(event: Event): void {
    event.preventDefault();
    if (this.searchTerm.trim()) {
      this.repoSearch = this.searchTerm;
      this.setView('Repositorio');
    }
  }

  // ==========================================================
  // PANTALLA DE DETALLE DE DOCUMENTO Y SISTEMA DE COMENTARIOS
  // ==========================================================

  openDocumentDetail(doc: AcademicDocument): void {
    this.previousView = this.activeView;
    this.selectedDocument = doc;
    this.activeView = 'Detalle Documento';
    this.newCommentText = '';
    this.replyingCommentId = null;
    this.editingCommentId = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  backFromDocumentDetail(): void {
    this.activeView = this.previousView === 'Detalle Documento' ? 'Repositorio' : this.previousView;
    this.selectedDocument = null;
  }

  downloadDocument(doc: AcademicDocument): void {
    doc.downloads++;
    this.showFeedback(
      `Descargando "${doc.name}" desde el repositorio oficial UAQ...`
    );
  }

  // Publicar comentario en el documento
  submitNewComment(): void {
    if (!this.selectedDocument || !this.newCommentText.trim()) return;

    const newComment: DocumentComment = {
      id: `c-${Date.now()}`,
      authorName: this.currentUser.name,
      authorInitials: this.currentUser.initials,
      authorRole: this.currentUser.role,
      authorExpediente: this.currentUser.expediente,
      timestamp: 'Justo ahora',
      content: this.newCommentText.trim(),
      likes: 0,
      userLiked: false,
      replies: [],
    };

    this.selectedDocument.comments.unshift(newComment);
    this.newCommentText = '';
    this.showFeedback('Tu comentario ha sido publicado en el documento.');
  }

  // Respuestas en hilos organizados
  startReply(commentId: string): void {
    this.replyingCommentId = commentId;
    this.replyText = '';
    this.editingCommentId = null;
  }

  cancelReply(): void {
    this.replyingCommentId = null;
    this.replyText = '';
  }

  submitReply(parentComment: DocumentComment): void {
    if (!this.replyText.trim()) return;

    if (!parentComment.replies) {
      parentComment.replies = [];
    }

    const reply: DocumentComment = {
      id: `rep-${Date.now()}`,
      authorName: this.currentUser.name,
      authorInitials: this.currentUser.initials,
      authorRole: this.currentUser.role,
      authorExpediente: this.currentUser.expediente,
      timestamp: 'Justo ahora',
      content: this.replyText.trim(),
      likes: 0,
      userLiked: false,
    };

    parentComment.replies.push(reply);
    this.replyingCommentId = null;
    this.replyText = '';
    this.showFeedback('Respuesta agregada al hilo de conversación.');
  }

  // Interacción «Me gusta»
  toggleLike(item: DocumentComment): void {
    item.userLiked = !item.userLiked;
    item.likes += item.userLiked ? 1 : -1;
  }

  // Edición de comentarios propios
  startEdit(comment: DocumentComment): void {
    this.editingCommentId = comment.id;
    this.editCommentText = comment.content;
    this.replyingCommentId = null;
  }

  cancelEdit(): void {
    this.editingCommentId = null;
    this.editCommentText = '';
  }

  saveEdit(comment: DocumentComment): void {
    if (!this.editCommentText.trim()) return;
    comment.content = this.editCommentText.trim();
    comment.isEdited = true;
    this.editingCommentId = null;
    this.editCommentText = '';
    this.showFeedback('Comentario actualizado.');
  }

  // Eliminación de comentarios propios
  deleteComment(comment: DocumentComment, parentComment?: DocumentComment): void {
    if (!this.selectedDocument) return;

    if (parentComment && parentComment.replies) {
      const idx = parentComment.replies.indexOf(comment);
      if (idx > -1) {
        parentComment.replies.splice(idx, 1);
        this.showFeedback('Respuesta eliminada.');
        return;
      }
    }

    // Si tiene respuestas, conservar el contexto visualmente
    if (comment.replies && comment.replies.length > 0) {
      comment.isDeleted = true;
      comment.content = 'Este comentario ha sido retirado por su autor.';
      this.showFeedback('Comentario eliminado (respuestas preservadas).');
    } else {
      const idx = this.selectedDocument.comments.indexOf(comment);
      if (idx > -1) {
        this.selectedDocument.comments.splice(idx, 1);
        this.showFeedback('Comentario eliminado.');
      }
    }
  }

  // Moderación y Reporte
  openReportModal(comment: DocumentComment): void {
    this.reportingComment = comment;
    this.selectedReportReason = 'Contenido fuera de contexto académico';
  }

  closeReportModal(): void {
    this.reportingComment = null;
  }

  confirmReport(): void {
    if (this.reportingComment) {
      this.reportingComment.isReported = true;
      this.reportingComment.reportReason = this.selectedReportReason;
      this.showFeedback(
        'El comentario ha sido reportado para revisión de la administración.'
      );
      this.closeReportModal();
    }
  }

  // Para el Administrador: Ocultar o descartar comentarios reportados
  dismissReport(comment: DocumentComment): void {
    comment.isReported = false;
    delete comment.reportReason;
    this.showFeedback('Reporte descartado. El comentario se mantiene visible.');
  }

  moderateHideComment(comment: DocumentComment): void {
    comment.content = '[Comentario retirado por la administración por incumplimiento normativo]';
    comment.isDeleted = true;
    comment.isReported = false;
    this.showFeedback('El comentario ha sido moderado y retirado.');
  }

  // Documentos reportados en total (para vista admin)
  get reportedCommentsList(): { docName: string; comment: DocumentComment }[] {
    const list: { docName: string; comment: DocumentComment }[] = [];
    for (const doc of this.documents) {
      for (const c of doc.comments) {
        if (c.isReported) {
          list.push({ docName: doc.name, comment: c });
        }
        if (c.replies) {
          for (const rep of c.replies) {
            if (rep.isReported) {
              list.push({ docName: doc.name, comment: rep });
            }
          }
        }
      }
    }
    return list;
  }

  // ==========================================================
  // GESTIÓN DE MATERIALES (PROFESOR Y ADMINISTRADOR)
  // ==========================================================

  openUploadModal(): void {
    this.isUploadModalOpen = true;
    this.uploadFormError = '';
    this.uploadTitle = '';
    this.uploadDescription = '';
    this.uploadFileName = '';
    this.uploadFileSize = '';
  }

  closeUploadModal(): void {
    this.isUploadModalOpen = false;
    this.uploadFormError = '';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.uploadFileName = file.name;
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      this.uploadFileSize = `${sizeMb} MB`;
      if (!this.uploadTitle) {
        this.uploadTitle = file.name.replace(/\.[^/.]+$/, '');
      }
    }
  }

  submitUpload(): void {
    if (!this.uploadTitle.trim()) {
      this.uploadFormError = 'Introduce un título para el material académico.';
      return;
    }

    if (!this.uploadFileName) {
      this.uploadFormError = 'Selecciona un archivo PDF, PPTX, DOCX o ZIP.';
      return;
    }

    const ext = this.uploadFileName.split('.').pop()?.toUpperCase() ?? 'PDF';
    const docType: 'PDF' | 'PPTX' | 'DOCX' | 'ZIP' =
      ext === 'PPTX'
        ? 'PPTX'
        : ext === 'DOCX'
        ? 'DOCX'
        : ext === 'ZIP'
        ? 'ZIP'
        : 'PDF';

    const newDoc: AcademicDocument = {
      id: `doc-${Date.now()}`,
      name: `${this.uploadTitle.trim()}.${ext.toLowerCase()}`,
      subject: this.uploadSubject,
      subjectCode: 'IS-301',
      type: docType,
      date: '26 oct. 2026',
      color: docType.toLowerCase(),
      size: this.uploadFileSize || '1.8 MB',
      unit: this.uploadUnit,
      category: this.uploadCategory,
      downloads: 0,
      author: this.currentUser.name,
      description:
        this.uploadDescription.trim() ||
        'Material académico oficial publicado en INFOUAQ.',
      comments: [],
    };

    this.documents.unshift(newDoc);
    this.closeUploadModal();
    this.showFeedback(
      `El documento "${newDoc.name}" ha sido incorporado al repositorio.`
    );
  }

  deleteDocumentFromRepo(doc: AcademicDocument): void {
    const idx = this.documents.indexOf(doc);
    if (idx > -1) {
      this.documents.splice(idx, 1);
      this.showFeedback(`Se retiró "${doc.name}" del repositorio.`);
    }
  }

  toggleUserStatus(user: InstitutionalUser): void {
    user.status = user.status === 'Activo' ? 'Inactivo' : 'Activo';
    this.showFeedback(
      `Estado de ${user.name} actualizado a: ${user.status}.`
    );
  }

  showFeedback(message: string): void {
    this.actionFeedback = message;
    setTimeout(() => {
      if (this.actionFeedback === message) {
        this.actionFeedback = null;
      }
    }, 4500);
  }
}
