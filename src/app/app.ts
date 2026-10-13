
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  email = '';
  password = '';
  showPassword = false;
  message = '';

  onSubmit(): void {
    this.message = '';

    const normalizedEmail = this.email.trim().toLowerCase();
    const institutionalEmail =
      /^[^\s@]+@(uaq\.mx|alumnos\.uaq\.mx)$/i;

    if (!institutionalEmail.test(normalizedEmail)) {
      this.message =
        'Utiliza tu correo institucional de la UAQ.';
      return;
    }

    this.message =
      'La interfaz funciona correctamente. La autenticación institucional todavía está pendiente de integración.';
  }
}
