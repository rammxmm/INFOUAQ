import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Dashboard } from './pages/dashboard/dashboard';
import { AuthService } from './services/auth.service';
import { CatalogService, Carrera } from './services/catalog.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, Dashboard],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly catalogService = inject(CatalogService);

  // Navegación de autenticación
  activeAuthTab: 'login' | 'register' | 'recovery' = 'login';
  showDashboard = false;
  isLoading = false;
  message = '';
  successMessage = '';

  // Formulario Login
  email = '';
  password = '';
  showPassword = false;

  // Formulario Registro Estudiante
  regNombre = '';
  regApellidos = '';
  regEmail = '';
  regExpediente = '';
  regCarreraId: number | null = null;
  regSemestre = 1;
  regPassword = '';
  regPasswordConfirm = '';
  showRegPassword = false;
  carrerasList: Carrera[] = [];

  // Formulario Recuperación
  recEmail = '';
  recToken = '';
  recPassword = '';
  recPasswordConfirm = '';
  recStep: 1 | 2 = 1;
  generatedTokenHint = '';

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.showDashboard = true;
    }
    this.cargarCarreras();
  }

  cargarCarreras(): void {
    this.catalogService.getCarreras().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.carrerasList = res.data;
          if (this.carrerasList.length > 0 && !this.regCarreraId) {
            this.regCarreraId = this.carrerasList[0].id;
          }
        }
      },
      error: () => {
        // Fallback institucional en caso de desconexión momentánea
        this.carrerasList = [
          { id: 1, clave: 'INF18', nombre: 'Licenciatura en Informática', creditos_totales: 312, activa: true },
          { id: 2, clave: 'LAT18', nombre: 'Licenciatura en Administración de Tecnologías de Información', creditos_totales: 312, activa: true },
          { id: 3, clave: 'SOF18', nombre: 'Ingeniería de Software', creditos_totales: 312, activa: true },
          { id: 4, clave: 'INC18', nombre: 'Ingeniería en Computación', creditos_totales: 312, activa: true },
          { id: 5, clave: 'TEL18', nombre: 'Ingeniería en Telecomunicaciones y Redes', creditos_totales: 312, activa: true },
          { id: 6, clave: 'CAD22', nombre: 'Ingeniería en Ciencia y Analítica de Datos', creditos_totales: 325, activa: true },
          { id: 7, clave: 'ITIC22', nombre: 'Ingeniería en Tecnologías de Información y Ciberseguridad', creditos_totales: 312, activa: true },
        ];
        this.regCarreraId = 1;
      },
    });
  }

  setTab(tab: 'login' | 'register' | 'recovery'): void {
    this.activeAuthTab = tab;
    this.message = '';
    this.successMessage = '';
  }

  // Submit Inicio de Sesión
  onSubmit(): void {
    this.message = '';
    this.successMessage = '';

    const email = this.email.trim().toLowerCase();
    const institutionalEmail = /^[^\s@]+@(uaq\.mx|alumnos\.uaq\.mx)$/;

    if (!institutionalEmail.test(email)) {
      this.message = 'Ingresa un correo institucional válido (@uaq.mx o @alumnos.uaq.mx).';
      return;
    }

    if (!this.password.trim()) {
      this.message = 'Ingresa tu contraseña.';
      return;
    }

    this.isLoading = true;

    this.authService.login(email, this.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.showDashboard = true;
      },
      error: (err) => {
        this.isLoading = false;
        this.message =
          err.error?.message ||
          err.error?.error ||
          'Correo o contraseña incorrectos.';
      },
    });
  }

  // Submit Registro Estudiante
  onRegisterSubmit(): void {
    this.message = '';
    this.successMessage = '';

    const correo = this.regEmail.trim().toLowerCase();
    if (!correo.endsWith('@alumnos.uaq.mx')) {
      this.message = 'El registro de estudiantes requiere tu correo institucional @alumnos.uaq.mx.';
      return;
    }

    if (!this.regNombre.trim() || !this.regApellidos.trim()) {
      this.message = 'Por favor ingresa tu nombre y apellidos completos.';
      return;
    }

    if (!this.regExpediente.trim() || !/^\d{5,7}$/.test(this.regExpediente.trim())) {
      this.message = 'Ingresa un número de expediente válido (5 a 7 dígitos).';
      return;
    }

    if (!this.regCarreraId) {
      this.message = 'Selecciona tu carrera de la Facultad de Informática.';
      return;
    }

    if (this.regPassword.length < 6) {
      this.message = 'La contraseña debe contener al menos 6 caracteres.';
      return;
    }

    if (this.regPassword !== this.regPasswordConfirm) {
      this.message = 'Las contraseñas no coinciden.';
      return;
    }

    this.isLoading = true;
    this.authService
      .register({
        nombre: this.regNombre.trim(),
        apellidos: this.regApellidos.trim(),
        correo,
        password: this.regPassword,
        expediente: this.regExpediente.trim(),
        carrera_id: Number(this.regCarreraId),
        semestre: Number(this.regSemestre),
      })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.showDashboard = true;
        },
        error: (err) => {
          this.isLoading = false;
          this.message =
            err.error?.message ||
            err.error?.error ||
            'Error al procesar el registro institucional.';
        },
      });
  }

  // Submit Recuperación Paso 1: Solicitar token
  onRequestRecoveryToken(): void {
    this.message = '';
    this.successMessage = '';

    const email = this.recEmail.trim().toLowerCase();
    if (!email.includes('@')) {
      this.message = 'Ingresa tu correo institucional registrado.';
      return;
    }

    this.isLoading = true;
    this.authService.forgotPassword(email).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.recStep = 2;
        this.successMessage = res.message || 'Se ha generado un token de recuperación.';
        if (res.data?.token) {
          this.recToken = res.data.token;
          this.generatedTokenHint = res.data.token;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.message =
          err.error?.message ||
          'No se pudo procesar la solicitud de recuperación.';
      },
    });
  }

  // Submit Recuperación Paso 2: Restablecer contraseña con token
  onResetPasswordSubmit(): void {
    this.message = '';
    this.successMessage = '';

    if (!this.recToken.trim()) {
      this.message = 'Ingresa el token de recuperación.';
      return;
    }

    if (this.recPassword.length < 6) {
      this.message = 'La nueva contraseña debe tener al menos 6 caracteres.';
      return;
    }

    if (this.recPassword !== this.recPasswordConfirm) {
      this.message = 'Las contraseñas no coinciden.';
      return;
    }

    this.isLoading = true;
    this.authService.resetPassword(this.recToken.trim(), this.recPassword).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = '¡Contraseña restablecida exitosamente! Ya puedes iniciar sesión.';
        this.activeAuthTab = 'login';
        this.recStep = 1;
        this.email = this.recEmail;
        this.password = '';
      },
      error: (err) => {
        this.isLoading = false;
        this.message =
          err.error?.message ||
          'Token inválido o expirado. Solicita uno nuevo.';
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.showDashboard = false;
    this.password = '';
    this.message = '';
    this.successMessage = '';
    this.activeAuthTab = 'login';
  }
}
