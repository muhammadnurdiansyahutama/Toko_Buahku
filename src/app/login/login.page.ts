import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
    standalone: false
})
export class LoginPage implements OnInit {
    loginForm!: FormGroup;
    showPassword = false;
    rememberMe = false;
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
        this.checkRememberedUser();
    }

    initForm() {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    checkRememberedUser() {
        const rememberedEmail = localStorage.getItem('remembered_email');
        if (rememberedEmail) {
            this.loginForm.patchValue({ email: rememberedEmail });
            this.rememberMe = true;
        }
    }

    togglePassword() {
        this.showPassword = !this.showPassword;
    }

    async onLogin() {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        const { email, password } = this.loginForm.value;

        this.authService.login(email, password).subscribe({
            next: async (result) => {
                if (result.success) {
                    // Remember email if checkbox is checked
                    if (this.rememberMe) {
                        localStorage.setItem('remembered_email', email);
                    } else {
                        localStorage.removeItem('remembered_email');
                    }

                    // Show success toast
                    await this.showToast(result.message, 'success');

                    // Navigate based on role
                    if (result.user?.role === 'penjual') {
                        this.router.navigate(['/seller-tabs'], { replaceUrl: true });
                    } else {
                        this.router.navigate(['/tabs/tab1'], { replaceUrl: true });
                    }
                } else {
                    this.errorMessage = result.message;
                }
                this.isLoading = false;
            },
            error: async (error) => {
                console.error('Login error:', error);
                this.errorMessage = 'Terjadi kesalahan saat login';
                this.isLoading = false;
            }
        });
    }

    onForgotPassword() {
        this.showToast('Fitur lupa password akan segera hadir!', 'warning');
    }

    goToRegister() {
        this.router.navigate(['/register']);
    }

    async showToast(message: string, color: string = 'primary') {
        const toast = await this.toastController.create({
            message,
            duration: 2000,
            position: 'top',
            color
        });
        await toast.present();
    }
}
