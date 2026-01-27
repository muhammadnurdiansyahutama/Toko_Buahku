import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-register',
    templateUrl: './register.page.html',
    styleUrls: ['./register.page.scss'],
    standalone: false
})
export class RegisterPage implements OnInit {
    registerForm!: FormGroup;
    showPassword = false;
    showConfirmPassword = false;
    isLoading = false;
    errorMessage = '';

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private toastController: ToastController
    ) { }

    ngOnInit() {
        this.initForm();
    }

    initForm() {
        this.registerForm = this.fb.group({
            nama: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            telepon: ['', [Validators.required, Validators.minLength(10), Validators.pattern(/^[0-9]+$/)]],
            alamat: ['', [Validators.required, Validators.minLength(10)]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]],
            agreeTerms: [false, [Validators.requiredTrue]]
        }, {
            validators: this.passwordMatchValidator
        });
    }

    passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
        const password = control.get('password');
        const confirmPassword = control.get('confirmPassword');

        if (!password || !confirmPassword) {
            return null;
        }

        return password.value === confirmPassword.value ? null : { passwordMismatch: true };
    }

    togglePassword() {
        this.showPassword = !this.showPassword;
    }

    toggleConfirmPassword() {
        this.showConfirmPassword = !this.showConfirmPassword;
    }

    async onRegister() {
        if (this.registerForm.invalid) {
            this.registerForm.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        const { nama, email, telepon, alamat, password } = this.registerForm.value;

        this.authService.register({
            nama,
            email,
            telepon,
            alamat,
            password
        }).subscribe({
            next: async (result) => {
                this.isLoading = false;
                if (result.success) {
                    // Show success toast
                    await this.showToast(result.message, 'success');

                    // Navigate to login page
                    this.router.navigate(['/login'], { replaceUrl: true });
                } else {
                    this.errorMessage = result.message;
                }
            },
            error: (error) => {
                this.isLoading = false;
                console.error('Registration error:', error);
                this.errorMessage = 'Terjadi kesalahan saat registrasi';
            }
        });
    }

    goToLogin() {
        this.router.navigate(['/login']);
    }

    async showToast(message: string, color: string = 'primary') {
        const toast = await this.toastController.create({
            message,
            duration: 2500,
            position: 'top',
            color
        });
        await toast.present();
    }
}
