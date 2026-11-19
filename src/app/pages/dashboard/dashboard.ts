import { Component, output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FileService } from '../../services/file.service';
import { CommentService, CommentNotification } from '../../services/comment.service';
import { AuthService } from '../../services/auth.service';
import { CatalogService, Carrera, MateriaCatalogo } from '../../services/catalog.service';
import { FolderService, CarpetaItem } from '../../services/folder.service';
import { AdminService, AdminUsuario, AdminReporte, AdminAuditoriaLog } from '../../services/admin.service';

export type UserRole = 'Estudiante' | 'Profesor' | 'Administrador' | 'ESTUDIANTE' | 'PROFESOR' | 'ADMINISTRADOR';

export interface UserProfile {
  id?: number;
  name: string;
  initials: string;
  role: string;
  expediente: string;
  email: string;
  carreraId?: number;
  carreraClave?: string | null;
  carreraOrDept: string;
  semestre?: number | null;
  semestreOrCargo: string;
  campus: string;
}

export interface DocumentComment {
  id: string;
  authorName: string;
  authorInitials: string;
  authorRole: string;
  isDocenteTitular?: boolean;
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
  isBookmarked?: boolean;
}

export interface Subject {
  id?: number;
  name: string;
  code: string;
  teacher: string;
  progress: number;
  semester: number;
  areaNombre?: string;
  units: {
    name: string;
    description: string;
    materialIds: string[];
  }[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly fileService = inject(FileService);
  private readonly commentService = inject(CommentService);
  private readonly authService = inject(AuthService);
  private readonly catalogService = inject(CatalogService);
  private readonly folderService = inject(FolderService);
  private readonly adminService = inject(AdminService);
  private readonly sanitizer = inject(DomSanitizer);

  logout = output<void>();

  // Estado de carga y archivo adjunto para subida
  selectedUploadFile: File | null = null;
  isUploading = false;
  isLoadingFiles = false;

  // Navegación principal
  activeView:
    | 'Inicio'
    | 'Materias'
    | 'Repositorio'
    | 'Mis Guardados'
    | 'Detalle Documento'
    | 'Panel Docente'
    | 'Panel Administrador'
    | 'Mi Perfil' = 'Inicio';

  previousView: typeof this.activeView = 'Inicio';

  // Notificaciones y alertas
  actionFeedback: string | null = null;

  currentUser: UserProfile = {
    name: 'Estudiante UAQ',
    initials: 'EQ',
    role: 'ESTUDIANTE',
    expediente: '298412',
    email: 'estudiante@alumnos.uaq.mx',
    carreraOrDept: 'Licenciatura en Informática',
    semestreOrCargo: '6° Semestre',
    campus: 'Centro Universitario UAQ',
  };

  // Helper para normalizar rol a mayúsculas
  get currentRoleNormalized(): 'ESTUDIANTE' | 'PROFESOR' | 'ADMINISTRADOR' {
    const r = (this.currentUser.role || 'ESTUDIANTE').toUpperCase();
    if (r.includes('ADMIN')) return 'ADMINISTRADOR';
    if (r.includes('PROF') || r.includes('DOCENT')) return 'PROFESOR';
    return 'ESTUDIANTE';
  }

  // Búsqueda en Inicio
  searchTerm = '';
  activeTab: 'Recientes' | 'Consultados' | 'Materias' = 'Recientes';

  // Catálogo de materias
  selectedSubject: Subject | null = null;
  subjectSearch = '';
  selectedSemester = 'Todos';
  selectedStatus = 'Todas';
  catalogMaterias: MateriaCatalogo[] = [];
  carrerasList: Carrera[] = [];
  selectedCarreraClave = 'Todas';

  // Repositorio de documentos
  repoSearch = '';
  selectedRepoSubject = 'Todas';
  selectedRepoType = 'Todos';
  selectedRepoCategory = 'Todas';
  repoViewMode: 'list' | 'grid' = 'list';

  // Documentos guardados / favoritos
  bookmarkedDocuments: AcademicDocument[] = [];
  isLoadingBookmarks = false;

  // Notificaciones del estudiante
  studentNotifications: CommentNotification[] = [];
  showNotificationsModal = false;

  // Pantalla de Detalle de Documento (con comentarios integrados y visor PDF)
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
  uploadSubjectId: number | null = null;
  uploadSemester = 1;
  uploadParcial: number | null = 1;
  uploadCategory: 'Guías' | 'Apuntes' | 'Prácticas' | 'Proyectos' = 'Guías';
  uploadCarpetaId: number | null = null;
  uploadDescription = '';
  uploadFileName = '';
  uploadFileSize = '';
  uploadFormError = '';

  // Gestor de carpetas del docente
  teacherCarpetas: CarpetaItem[] = [];
  nuevaCarpetaNombre = '';
  selectedDocenteMateriaId: number | null = null;

  // Panel Administrador: Tabs y datos
  adminTab: 'materias' | 'usuarios' | 'reportes' | 'auditoria' = 'materias';
  adminUsuarios: AdminUsuario[] = [];
  adminReportes: AdminReporte[] = [];
  adminAuditoria: AdminAuditoriaLog[] = [];
  adminSubjectSearch = '';
  adminUserSearch = '';
  adminNewMateria = {
    clave: '',
    nombre: '',
    descripcion: '',
    creditos: 8,
    area_id: 1,
    carrera_id: 1,
    semestre: 1,
  };
  adminAssignTeacher = {
    materia_id: 0,
    profesor_id: 0,
  };

  // Base de datos de documentos académicos
  documents: AcademicDocument[] = [];

  // Catálogo de materias para la vista
  subjects: Subject[] = [];

  ngOnInit(): void {
    const authUser = this.authService.getUser();
    if (authUser) {
      this.currentUser = authUser;
    }

    this.cargarCarreras();
    this.cargarCatalogoMaterias();
    this.cargarArchivosDesdeServidor();

    if (this.currentRoleNormalized === 'ESTUDIANTE') {
      this.cargarGuardados();
      this.cargarNotificaciones();
    } else if (this.currentRoleNormalized === 'ADMINISTRADOR') {
      this.cargarDatosAdmin();
    }
  }

  cargarCarreras(): void {
    this.catalogService.getCarreras().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.carrerasList = res.data;
        }
      },
      error: () => {},
    });
  }

  cargarCatalogoMaterias(): void {
    const carreraClave =
      this.currentRoleNormalized === 'ESTUDIANTE' && this.currentUser.carreraClave
        ? this.currentUser.carreraClave
        : undefined;

    this.catalogService.getMaterias({ carreraClave }).subscribe({
      next: (res) => {
        if (res && res.data && res.data.length > 0) {
          this.catalogMaterias = res.data;
          this.subjects = res.data.map((m) => {
            const docente = m.materias_profesores?.[0]?.profesor;
            const docenteNombre = docente
              ? `${docente.nombre} ${docente.apellidos}`.trim()
              : 'Coordinación Académica UAQ';
            const sem = m.materias_carreras?.[0]?.semestre || 1;
            return {
              id: m.id,
              name: m.nombre,
              code: m.clave,
              teacher: docenteNombre,
              progress: 60,
              semester: sem,
              areaNombre: m.area?.nombre,
              units: [
                {
                  name: 'Materiales Generales del Curso',
                  description: m.descripcion || `Recursos oficiales de ${m.nombre}`,
                  materialIds: [],
                },
              ],
            };
          });

          // Seleccionar primera materia para el panel docente
          if (this.subjects.length > 0 && !this.selectedDocenteMateriaId) {
            this.selectedDocenteMateriaId = this.subjects[0].id || null;
            if (this.selectedDocenteMateriaId) {
              this.cargarCarpetas(this.selectedDocenteMateriaId);
            }
          }
        }
      },
      error: (err) => {
        console.warn('Catálogo de materias no disponible:', err);
      },
    });
  }

  cargarArchivosDesdeServidor(): void {
    this.isLoadingFiles = true;
    const userId = this.currentUser.id;

    this.fileService.getFiles({ userId }).subscribe({
      next: (archivos) => {
        this.isLoadingFiles = false;
        if (archivos) {
          this.documents = archivos;
        }
      },
      error: (err) => {
        this.isLoadingFiles = false;
        console.warn('Backend API no disponible para archivos:', err);
      },
    });
  }

  cargarGuardados(): void {
    if (!this.currentUser.id) return;
    this.isLoadingBookmarks = true;
    this.fileService.getBookmarks(this.currentUser.id).subscribe({
      next: (guardados) => {
        this.isLoadingBookmarks = false;
        this.bookmarkedDocuments = guardados;
      },
      error: () => {
        this.isLoadingBookmarks = false;
      },
    });
  }

  cargarNotificaciones(): void {
    if (!this.currentUser.id) return;
    this.commentService.getNotifications(this.currentUser.id).subscribe({
      next: (notifs) => {
        this.studentNotifications = notifs || [];
      },
      error: () => {},
    });
  }

  toggleBookmark(doc: AcademicDocument): void {
    this.fileService.toggleBookmark(doc.id, this.currentUser.id).subscribe({
      next: (res) => {
        doc.isBookmarked = res.saved;
        this.showFeedback(res.message);
        this.cargarGuardados();
      },
      error: () => {
        doc.isBookmarked = !doc.isBookmarked;
        this.showFeedback(
          doc.isBookmarked ? 'Material guardado.' : 'Material retirado de guardados.'
        );
      },
    });
  }

  getSafePreviewUrl(docId: string): SafeResourceUrl {
    const rawUrl = this.fileService.getPreviewUrl(docId);
    return this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
  }

  // Navegación
  setView(view: typeof this.activeView): void {
    this.previousView = this.activeView;
    this.activeView = view;
    this.selectedSubject = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (view === 'Mis Guardados') {
      this.cargarGuardados();
    } else if (view === 'Panel Administrador') {
      this.cargarDatosAdmin();
    }
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

    // Cargar comentarios en tiempo real desde PostgreSQL
    const numId = parseInt(doc.id, 10);
    if (!isNaN(numId)) {
      this.commentService.getComments(doc.id, this.currentUser.id?.toString()).subscribe({
        next: (comentarios) => {
          if (comentarios && comentarios.length > 0) {
            doc.comments = comentarios;
          }
        },
        error: (err) => {
          console.warn('Comentarios no disponibles:', err);
        },
      });
    }
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
    this.fileService.triggerDownload(doc.id, doc.name);
  }

  submitNewComment(): void {
    if (!this.selectedDocument || !this.newCommentText.trim()) return;
    const texto = this.newCommentText.trim();
    const docActual = this.selectedDocument;

    this.commentService
      .addComment(docActual.id, {
        content: texto,
        authorId: this.currentUser.id,
        authorName: this.currentUser.name,
        authorRole: this.currentUser.role,
        authorExpediente: this.currentUser.expediente,
      })
      .subscribe({
        next: (nuevo) => {
          docActual.comments.unshift(nuevo);
          this.newCommentText = '';
          this.showFeedback('Tu comentario ha sido publicado en el documento.');
        },
        error: (err) => {
          console.error('Error al guardar comentario:', err);
          this.showFeedback('No fue posible publicar el comentario en este momento.');
        },
      });
  }

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
    if (!this.replyText.trim() || !this.selectedDocument) return;
    const texto = this.replyText.trim();
    const docActual = this.selectedDocument;
    const parentIdNum = parseInt(parentComment.id, 10);

    this.commentService
      .addComment(docActual.id, {
        content: texto,
        parentId: !isNaN(parentIdNum) ? parentIdNum : undefined,
        authorId: this.currentUser.id,
        authorName: this.currentUser.name,
        authorRole: this.currentUser.role,
        authorExpediente: this.currentUser.expediente,
      })
      .subscribe({
        next: (reply) => {
          if (!parentComment.replies) parentComment.replies = [];
          parentComment.replies.push(reply);
          this.cancelReply();
          this.showFeedback('Respuesta agregada al hilo de discusión.');
        },
        error: (err) => {
          console.error('Error al guardar respuesta:', err);
          this.showFeedback('No fue posible registrar tu respuesta.');
        },
      });
  }

  toggleCommentLike(comment: DocumentComment): void {
    const numId = parseInt(comment.id, 10);
    if (!isNaN(numId)) {
      this.commentService.toggleLike(comment.id, this.currentUser.id).subscribe({
        next: (res) => {
          comment.likes = res.likes;
          comment.userLiked = res.userLiked;
        },
        error: () => {
          comment.userLiked = !comment.userLiked;
          comment.likes += comment.userLiked ? 1 : -1;
        },
      });
      return;
    }
    comment.userLiked = !comment.userLiked;
    comment.likes += comment.userLiked ? 1 : -1;
  }

  startEditComment(comment: DocumentComment): void {
    this.editingCommentId = comment.id;
    this.editCommentText = comment.content;
    this.replyingCommentId = null;
  }

  cancelEditComment(): void {
    this.editingCommentId = null;
    this.editCommentText = '';
  }

  saveEditComment(comment: DocumentComment): void {
    if (!this.editCommentText.trim()) return;
    const nuevoTexto = this.editCommentText.trim();

    this.commentService.editComment(comment.id, nuevoTexto).subscribe({
      next: (res) => {
        comment.content = res.content;
        comment.isEdited = true;
        this.cancelEditComment();
        this.showFeedback('Comentario editado con éxito.');
      },
      error: () => {
        comment.content = nuevoTexto;
        comment.isEdited = true;
        this.cancelEditComment();
      },
    });
  }

  deleteComment(comment: DocumentComment, parentComment?: DocumentComment): void {
    if (!confirm('¿Deseas eliminar este comentario?')) return;

    this.commentService.deleteComment(comment.id).subscribe({
      next: () => {
        comment.isDeleted = true;
        comment.content = '[Comentario eliminado por el autor]';
        this.showFeedback('Comentario eliminado.');
      },
      error: () => {
        comment.isDeleted = true;
        comment.content = '[Comentario eliminado por el autor]';
        this.showFeedback('Comentario eliminado.');
      },
    });
  }

  openReportModal(comment: DocumentComment): void {
    this.reportingComment = comment;
    this.selectedReportReason = 'Contenido fuera de contexto académico';
  }

  closeReportModal(): void {
    this.reportingComment = null;
  }

  submitReport(): void {
    if (!this.reportingComment) return;
    const comment = this.reportingComment;
    const reason = this.selectedReportReason;

    this.commentService
      .reportComment(comment.id, reason, this.currentUser.id, this.currentUser.name)
      .subscribe({
        next: () => {
          comment.isReported = true;
          this.closeReportModal();
          this.showFeedback(
            'Comentario remitido a la moderación de la Facultad de Informática.'
          );
        },
        error: () => {
          comment.isReported = true;
          this.closeReportModal();
          this.showFeedback('Reporte registrado.');
        },
      });
  }

  // ==========================================================
  // PANEL DOCENTE Y GESTOR DE CARPETAS
  // ==========================================================

  cargarCarpetas(materiaId: number): void {
    this.folderService.getCarpetasMateria(materiaId).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.teacherCarpetas = res.data;
        }
      },
      error: () => {
        this.teacherCarpetas = [];
      },
    });
  }

  onDocenteMateriaChange(materiaId: number): void {
    this.selectedDocenteMateriaId = materiaId;
    this.cargarCarpetas(materiaId);
  }

  crearCarpeta(): void {
    if (!this.nuevaCarpetaNombre.trim() || !this.selectedDocenteMateriaId) {
      this.showFeedback('Escribe un nombre para la carpeta.');
      return;
    }

    this.folderService
      .crearCarpeta({
        nombre: this.nuevaCarpetaNombre.trim(),
        materia_id: this.selectedDocenteMateriaId,
      })
      .subscribe({
        next: (res) => {
          this.teacherCarpetas.push(res.data);
          this.nuevaCarpetaNombre = '';
          this.showFeedback('Carpeta creada con éxito.');
        },
        error: (err) => {
          this.showFeedback(err.error?.message || 'Error al crear carpeta.');
        },
      });
  }

  eliminarCarpeta(carpetaId: number): void {
    if (!confirm('¿Seguro de eliminar esta carpeta?')) return;
    this.folderService.eliminarCarpeta(carpetaId).subscribe({
      next: () => {
        this.teacherCarpetas = this.teacherCarpetas.filter((c) => c.id !== carpetaId);
        this.showFeedback('Carpeta eliminada.');
      },
      error: (err) => {
        this.showFeedback(err.error?.message || 'No se pudo eliminar la carpeta.');
      },
    });
  }

  // ==========================================================
  // SUBIDA Y EDICIÓN DE ARCHIVOS
  // ==========================================================

  openUploadModal(): void {
    this.isUploadModalOpen = true;
    this.uploadFormError = '';
    this.uploadTitle = '';
    this.uploadDescription = '';
    this.uploadFileName = '';
    this.uploadFileSize = '';
    this.uploadParcial = 1;
    this.uploadCategory = 'Guías';
    this.selectedUploadFile = null;
    this.isUploading = false;

    if (this.subjects.length > 0) {
      this.uploadSubject = this.subjects[0].name;
      this.uploadSubjectId = this.subjects[0].id || null;
      this.uploadSemester = this.subjects[0].semester;
    }
  }

  closeUploadModal(): void {
    this.isUploadModalOpen = false;
    this.uploadFormError = '';
    this.selectedUploadFile = null;
    this.isUploading = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedUploadFile = file;
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

    if (!this.selectedUploadFile) {
      this.uploadFormError = 'Selecciona un archivo PDF institucional (máx. 25 MB).';
      return;
    }

    this.isUploading = true;
    this.uploadFormError = '';

    const carreraClave = this.currentUser.carreraClave || 'INF18';

    this.fileService
      .uploadFile(this.selectedUploadFile, {
        titulo: this.uploadTitle.trim(),
        descripcion: this.uploadDescription.trim(),
        carreraId: carreraClave,
        materia: this.uploadSubject,
        materia_id: this.uploadSubjectId || undefined,
        semestre: this.uploadSemester,
        categoria: this.uploadCategory,
        parcial: this.uploadParcial || undefined,
        carpeta_id: this.uploadCarpetaId || undefined,
        autorNombre: this.currentUser.name,
        autorRol: this.currentUser.role,
      })
      .subscribe({
        next: (docCreado) => {
          this.isUploading = false;
          this.documents.unshift(docCreado);
          this.closeUploadModal();
          this.showFeedback(
            `El documento "${docCreado.name}" ha sido incorporado al repositorio y guardado en PostgreSQL.`
          );
        },
        error: (err) => {
          this.isUploading = false;
          console.error('Error al subir archivo:', err);
          this.uploadFormError =
            err.error?.message ||
            'Error al subir el archivo al servidor. Asegúrate de ser Profesor o Administrador y usar formato PDF.';
        },
      });
  }

  deleteDocumentFromRepo(doc: AcademicDocument): void {
    if (!confirm(`¿Deseas retirar "${doc.name}" del repositorio institucional?`)) return;

    this.fileService.deleteFile(doc.id).subscribe({
      next: () => {
        this.documents = this.documents.filter((d) => d.id !== doc.id);
        this.showFeedback(`Se retiró "${doc.name}" del repositorio y de la base de datos.`);
      },
      error: (err) => {
        this.showFeedback(err.error?.message || 'Error al eliminar el archivo.');
      },
    });
  }

  // ==========================================================
  // PANEL ADMINISTRADOR (CATÁLOGO, USUARIOS, REPORTES, AUDITORÍA)
  // ==========================================================

  cargarDatosAdmin(): void {
    this.adminService.listarUsuarios().subscribe({
      next: (res) => (this.adminUsuarios = res.data || []),
      error: () => {},
    });
    this.adminService.listarReportes().subscribe({
      next: (res) => (this.adminReportes = res.data || []),
      error: () => {},
    });
    this.adminService.listarAuditoria(50).subscribe({
      next: (res) => (this.adminAuditoria = res.data || []),
      error: () => {},
    });
  }

  crearMateriaAdmin(): void {
    if (!this.adminNewMateria.clave.trim() || !this.adminNewMateria.nombre.trim()) {
      this.showFeedback('Clave y Nombre de la materia son obligatorios.');
      return;
    }

    this.adminService
      .crearMateria({
        clave: this.adminNewMateria.clave.trim().toUpperCase(),
        nombre: this.adminNewMateria.nombre.trim(),
        descripcion: this.adminNewMateria.descripcion.trim(),
        creditos: this.adminNewMateria.creditos,
        area_id: Number(this.adminNewMateria.area_id),
        carreras: [
          {
            carrera_id: Number(this.adminNewMateria.carrera_id),
            semestre: Number(this.adminNewMateria.semestre),
          },
        ],
      })
      .subscribe({
        next: (res) => {
          this.showFeedback('Materia agregada exitosamente al catálogo oficial.');
          this.cargarCatalogoMaterias();
          this.adminNewMateria = {
            clave: '',
            nombre: '',
            descripcion: '',
            creditos: 8,
            area_id: 1,
            carrera_id: 1,
            semestre: 1,
          };
        },
        error: (err) => {
          this.showFeedback(err.error?.message || 'Error al registrar materia.');
        },
      });
  }

  asignarProfesorMateria(): void {
    if (!this.adminAssignTeacher.materia_id || !this.adminAssignTeacher.profesor_id) {
      this.showFeedback('Selecciona una materia y un profesor.');
      return;
    }

    this.adminService
      .asignarProfesor(
        Number(this.adminAssignTeacher.materia_id),
        Number(this.adminAssignTeacher.profesor_id),
      )
      .subscribe({
        next: () => {
          this.showFeedback('Profesor asignado a la materia con éxito.');
          this.cargarCatalogoMaterias();
        },
        error: (err) => {
          this.showFeedback(err.error?.message || 'Error al asignar profesor.');
        },
      });
  }

  actualizarRolUsuarioAdmin(user: AdminUsuario, rolId: number): void {
    this.adminService.actualizarRolUsuario(user.id, rolId).subscribe({
      next: (res) => {
        user.rolId = rolId;
        user.rolNombre = res.data?.rolNombre || 'Actualizado';
        this.showFeedback(`Rol de ${user.nombreCompleto} actualizado a ${user.rolNombre}.`);
      },
      error: (err) => {
        this.showFeedback(err.error?.message || 'Error al cambiar rol.');
      },
    });
  }

  actualizarEstadoUsuarioAdmin(user: AdminUsuario, estado: 'ACTIVA' | 'SUSPENDIDA' | 'INACTIVA'): void {
    this.adminService.actualizarEstadoUsuario(user.id, estado).subscribe({
      next: () => {
        user.estado = estado;
        this.showFeedback(`Estado de ${user.nombreCompleto} cambiado a ${estado}.`);
      },
      error: (err) => {
        this.showFeedback(err.error?.message || 'Error al cambiar estado.');
      },
    });
  }

  descartarReporteAdmin(reporte: AdminReporte): void {
    this.adminService.descartarReporte(reporte.id, this.currentUser.id).subscribe({
      next: () => {
        reporte.estado = 'DESCARTADO';
        this.showFeedback('Reporte descartado.');
      },
      error: (err) => {
        this.showFeedback(err.error?.message || 'Error al descartar reporte.');
      },
    });
  }

  eliminarComentarioReportadoAdmin(reporte: AdminReporte): void {
    if (!confirm('¿Confirmas eliminar este comentario por violar normas comunitarias?')) return;

    this.adminService
      .eliminarComentarioReportado(reporte.id, this.currentUser.id)
      .subscribe({
        next: () => {
          reporte.estado = 'CONFIRMADO';
          this.showFeedback('Comentario eliminado y reporte resuelto.');
          this.cargarArchivosDesdeServidor();
        },
        error: (err) => {
          this.showFeedback(err.error?.message || 'Error al procesar moderación.');
        },
      });
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
