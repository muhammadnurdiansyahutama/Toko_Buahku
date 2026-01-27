import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-edit-profile-modal',
    templateUrl: './edit-profile-modal.component.html',
    styleUrls: ['./edit-profile-modal.component.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, FormsModule]
})
export class EditProfileModalComponent implements OnInit {
    userData = {
        nama: '',
        email: '',
        telepon: '',
        alamat: ''
    };

    isProcessing: boolean = false;

    constructor(
        private modalController: ModalController,
        private authService: AuthService,
        private apiService: ApiService,
        private toastController: ToastController
    ) { }

    ngOnInit() {
        // Load current user data
        const currentUser = this.authService.getCurrentUserValue();
        if (currentUser) {
            this.userData = {
                nama: currentUser.nama,
                email: currentUser.email,
                telepon: currentUser.telepon,
                alamat: currentUser.alamat
            };
        }
    }

    dismiss() {
        this.modalController.dismiss();
    }

    async saveProfile() {
        // Validation
        if (!this.userData.nama || !this.userData.email) {
            this.showError('Nama dan Email harus diisi');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.userData.email)) {
            this.showError('Format email tidak valid');
            return;
        }

        // Phone validation (basic)
        if (this.userData.telepon && this.userData.telepon.length < 10) {
            this.showError('Nomor telepon minimal 10 digit');
            return;
        }

        this.isProcessing = true;

        const currentUser = this.authService.getCurrentUserValue();
        if (!currentUser || !currentUser.id) {
            this.showError('User tidak ditemukan');
            this.isProcessing = false;
            return;
        }

        // Prepare update data
        const updateData = {
            id: currentUser.id,
            name: this.userData.nama,
            email: this.userData.email,
            phone: this.userData.telepon,
            address: this.userData.alamat
        };

        // Call API
        this.apiService.updateProfile(updateData).subscribe({
            next: (data) => {
                // Update successfully, now update local state
                if (data && data.user) {
                    const updatedUser = {
                        nama: data.user.name || data.user.nama,
                        email: data.user.email,
                        telepon: data.user.phone || data.user.telepon,
                        alamat: data.user.address || data.user.alamat
                    };

                    this.authService.updateCurrentUser(updatedUser);

                    this.showSuccess('Profil berhasil diperbarui');
                    this.modalController.dismiss({ updated: true });
                } else {
                    // Fallback if API doesn't return user object but success is true
                    this.authService.updateCurrentUser(this.userData);
                    this.showSuccess('Profil berhasil diperbarui');
                    this.modalController.dismiss({ updated: true });
                }
                this.isProcessing = false;
            },
            error: (error) => {
                console.error('Update profile error:', error);
                this.showError(error.message || 'Gagal memperbarui profil');
                this.isProcessing = false;
            }
        });
    }

    async showSuccess(message: string) {
        const toast = await this.toastController.create({
            message: message,
            duration: 2000,
            position: 'bottom',
            color: 'success',
            icon: 'checkmark-circle-outline'
        });
        toast.present();
    }

    async showError(message: string) {
        const toast = await this.toastController.create({
            message: message,
            duration: 3000,
            position: 'bottom',
            color: 'danger',
            icon: 'alert-circle-outline'
        });
        toast.present();
    }
}
