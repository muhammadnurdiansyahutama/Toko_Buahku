import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, AlertController, ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-tab4',
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
  standalone: false,
})
export class Tab4Page implements OnInit {
  userName: string = '';
  userEmail: string = '';
  userPhone: string = '';
  userAddress: string = '';

  totalOrders: number = 0;
  totalWishlist: number = 0;
  totalReviews: number = 0;

  darkMode: boolean = false;
  isLoading: boolean = true;
  userId: number = 2; // Mock user ID

  constructor(
    private router: Router,
    private authService: AuthService,
    private apiService: ApiService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.loadUserData();
  }

  ionViewWillEnter() {
    this.loadUserData();
  }

  /**
   * Load user data from AuthService
   */
  loadUserData() {
    this.isLoading = true;

    const currentUser = this.authService.getCurrentUserValue();
    if (currentUser) {
      this.userName = currentUser.nama;
      this.userEmail = currentUser.email;
      this.userPhone = currentUser.telepon;
      this.userAddress = currentUser.alamat;

      // Load stats from API using real user ID
      if (currentUser.id) {
        this.apiService.getOrders(currentUser.id).subscribe({
          next: (orders) => {
            this.totalOrders = orders.length;
            this.isLoading = false;
          },
          error: () => {
            // Silently fail or just set to 0
            this.totalOrders = 0;
            this.isLoading = false;
          }
        });
      } else {
        this.isLoading = false;
      }
    } else {
      this.isLoading = false;
    }

    // Mock wishlist and reviews for now
    this.totalWishlist = 0;
    this.totalReviews = 0;
  }

  async editProfile() {
    const modal = await this.modalController.create({
      component: await import('../modals/edit-profile-modal/edit-profile-modal.component').then(m => m.EditProfileModalComponent),
      cssClass: 'edit-profile-modal'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data && data.updated) {
      // Reload user data after update
      this.loadUserData();
    }
  }

  goToOrders() {
    this.router.navigate(['/tabs/tab3']);
  }

  goToWishlist() {
    console.log('Go to wishlist');
    this.showToast('Fitur Wishlist segera hadir!', 'warning');
  }

  goToReviews() {
    console.log('Go to reviews');
    this.showToast('Fitur Reviews segera hadir!', 'warning');
  }

  navigateTo(page: string) {
    console.log('Navigate to:', page);

    // Show coming soon for unimplemented features
    const comingSoonPages = ['addresses', 'payment', 'vouchers', 'notifications', 'language', 'theme', 'help', 'contact', 'about'];
    if (comingSoonPages.includes(page)) {
      this.showToast('Fitur ini segera hadir!', 'warning');
    }
  }

  toggleDarkMode() {
    console.log('Dark mode:', this.darkMode);
    document.body.classList.toggle('dark', this.darkMode);
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Konfirmasi Keluar',
      message: 'Apakah Anda yakin ingin keluar dari akun?',
      buttons: [
        {
          text: 'Batal',
          role: 'cancel'
        },
        {
          text: 'Keluar',
          role: 'destructive',
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
            this.showToast('Berhasil keluar dari akun', 'success');
          }
        }
      ]
    });

    await alert.present();
  }

  openPrivacy() {
    this.showToast('Kebijakan Privasi segera hadir!', 'warning');
  }

  openTerms() {
    this.showToast('Syarat & Ketentuan segera hadir!', 'warning');
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: color
    });
    toast.present();
  }
}
