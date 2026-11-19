import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { UserProfile } from '../pages/dashboard/dashboard';

export interface AuthResponse {
  accessToken: string;
  user: UserProfile;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:3000/api/auth';
  private currentUser: UserProfile | null = null;
  private token: string | null = null;

  constructor(private readonly http: HttpClient) {
    this.cargarSesionAlmacenada();
  }

  private cargarSesionAlmacenada(): void {
    try {
      const storedUser = localStorage.getItem('infouaq_user');
      const storedToken = localStorage.getItem('infouaq_token');
      if (storedUser && storedToken) {
        this.currentUser = JSON.parse(storedUser);
        this.token = storedToken;
      }
    } catch {
      this.currentUser = null;
      this.token = null;
    }
  }

  /**
   * Inicia sesión en la API de NestJS con correo y contraseña
   */
  login(correo: string, password: string): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, {
        correo,
        password,
      })
      .pipe(
        tap((res) => {
          if (res && res.data) {
            this.token = res.data.accessToken;
            this.currentUser = res.data.user;
            localStorage.setItem('infouaq_token', this.token);
            localStorage.setItem('infouaq_user', JSON.stringify(this.currentUser));
          }
        }),
      );
  }

  /**
   * Registro de nuevo estudiante
   */
  register(datos: {
    correo: string;
    password: string;
    nombre: string;
    apellidos: string;
    carreraClave?: string;
    semestre?: number;
  }): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, datos)
      .pipe(
        tap((res) => {
          if (res && res.data) {
            this.token = res.data.accessToken;
            this.currentUser = res.data.user;
            localStorage.setItem('infouaq_token', this.token);
            localStorage.setItem('infouaq_user', JSON.stringify(this.currentUser));
          }
        }),
      );
  }

  /**
   * Cierra la sesión
   */
  logout(): void {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('infouaq_token');
    localStorage.removeItem('infouaq_user');
  }

  /**
   * Obtiene el usuario autenticado actualmente
   */
  getUser(): UserProfile | null {
    return this.currentUser;
  }

  /**
   * Guarda o actualiza el usuario activo
   */
  setUser(user: UserProfile): void {
    this.currentUser = user;
    localStorage.setItem('infouaq_user', JSON.stringify(user));
  }

  /**
   * Obtiene el token JWT
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Verifica si hay una sesión activa
   */
  isAuthenticated(): boolean {
    return !!this.token && !!this.currentUser;
  }
}
