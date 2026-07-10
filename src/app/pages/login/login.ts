import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html'
})
export class Login {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  });

  constructor(private supabaseService: SupabaseService, private router: Router) {}

  async entrar() {
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value;
    const { error } = await this.supabaseService.supabase.auth.signInWithPassword({
      email: email!,
      password: password!
    });
    
    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      this.router.navigate(['/cuentas']);
    }
  }
}