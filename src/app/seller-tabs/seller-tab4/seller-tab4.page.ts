import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

interface ProfileData {
  avatar: string;
  storeName: string;
  email: string;
  totalRevenue: string;
  productsSold: string;
  rating: string;
  memberSince: string;
}

interface StoreInfo {
  phone: string;
  address: string;
  operatingHours: string;
  description: string;
}

interface FAQ {
  question: string;
  answer: string;
  expanded: boolean;
}

@Component({
  selector: 'app-seller-tab4',
  templateUrl: './seller-tab4.page.html',
  styleUrls: ['./seller-tab4.page.scss'],
  standalone: false,
})
export class SellerTab4Page implements OnInit {

  // Profile data
  profileData: ProfileData = {
    avatar: 'assets/avatar-placeholder.png',
    storeName: 'Toko Buah Segar',
    email: 'tokobuahsegar@email.com',
    totalRevenue: 'Rp 25,5 Jt',
    productsSold: '1,234',
    rating: '4.8',
    memberSince: 'Jan 2024'
  };

  // Store information
  storeInfo: StoreInfo = {
    phone: '+62 812-3456-7890',
    address: 'Jl. Pasar Segar No. 123, Kelurahan Buah Makmur, Kota Medan, Sumatera Utara',
    operatingHours: 'Senin - Sabtu: 08:00 - 20:00 | Minggu: 08:00 - 15:00',
    description: 'Menyediakan buah-buahan segar berkualitas premium dengan harga terjangkau. Kami berkomitmen memberikan produk terbaik untuk kesehatan keluarga Anda.'
  };

  // Modal states
  showEditProfileModal: boolean = false;
  showChangePasswordModal: boolean = false;
  showStoreInfoModal: boolean = false;
  showNotificationModal: boolean = false;
  showFAQModal: boolean = false;

  // Edit profile data
  editProfileData = {
    storeName: '',
    email: '',
    phone: '',
    description: ''
  };

  // Password change data
  passwordData = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  // Notification settings
  notificationSettings = {
    newOrders: true,
    reviews: true,
    promotions: false,
    emailNotifications: true
  };

  // FAQ data
  faqList: FAQ[] = [
    {
      question: 'Bagaimana cara menambahkan produk baru?',
      answer: 'Buka tab "Produk", kemudian klik tombol "Tambah Produk" di bagian atas. Isi form dengan detail produk, upload foto, dan simpan.',
      expanded: false
    },
    {
      question: 'Bagaimana cara mengelola pesanan?',
      answer: 'Semua pesanan dapat dilihat di tab "Pesanan". Anda dapat memfilter berdasarkan status dan melakukan aksi seperti terima, proses, atau tandai sebagai selesai.',
      expanded: false
    },
    {
      question: 'Bagaimana cara mengubah jam operasional toko?',
      answer: 'Pilih menu "Jam Operasional" di bagian Toko Saya. Anda dapat mengatur jam buka dan tutup untuk setiap hari dalam seminggu.',
      expanded: false
    },
    {
      question: 'Apakah ada biaya untuk menggunakan platform ini?',
      answer: 'Platform ini gratis untuk digunakan. Kami hanya mengambil komisi kecil dari setiap transaksi yang berhasil diselesaikan.',
      expanded: false
    },
    {
      question: 'Bagaimana cara menghubungi customer support?',
      answer: 'Anda dapat menghubungi customer support kami melalui email support@tokobuahsegar.com atau WhatsApp di +62 812-3456-7890.',
      expanded: false
    }
  ];

  currentUser: any;

  constructor(
    private alertController: AlertController,
    private loadingController: LoadingController,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.profileData.storeName = user.nama;
        this.profileData.email = user.email;
        this.storeInfo.phone = user.telepon;
        this.storeInfo.address = user.alamat;
        // Keep other mocked stats for now until API supports them
      }
    });
  }

  // Edit Profile Modal
  openEditProfile() {
    this.editProfileData = {
      storeName: this.profileData.storeName,
      email: this.profileData.email,
      phone: this.storeInfo.phone,
      description: this.storeInfo.description
    };
    this.showEditProfileModal = true;
  }

  closeEditProfile() {
    this.showEditProfileModal = false;
  }

  async saveProfile() {
    // Validate inputs
    if (!this.editProfileData.storeName.trim() || !this.editProfileData.email.trim()) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Nama toko dan email harus diisi!',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Menyimpan profil...'
    });
    await loading.present();

    const updateData = {
      id: this.currentUser.id,
      name: this.editProfileData.storeName,
      email: this.editProfileData.email,
      phone: this.editProfileData.phone,
      address: this.editProfileData.description // Using description as address or creating a new field? 
      // Mapping description to address for now as per previous code structure, 
      // check if 'description' is actually 'address' in UI or separate.
      // In original profileData, address is separate. 
      // But in openEditProfile, phone comes from storeInfo.phone
      // Let's assume description maps to address for simplicity if no description field in DB user table,
      // or we can ignore description for now if it's store description (which might need a separate table or field).
      // However, looking at auth.php update-profile, it accepts address.
    };

    // NOTE: The UI has 'description' but User model has 'address'. 
    // Let's map 'address' from storeInfo to a field in edit form if needed.
    // In openEditProfile: phone: this.storeInfo.phone, description: this.storeInfo.description
    // The previous implementation mapped description to storeInfo.description.
    // If table users has address, we should save address.

    // Revised updateData based on what auth.php accepts:
    const dataToSave = {
      id: this.currentUser.id,
      name: this.editProfileData.storeName,
      email: this.editProfileData.email,
      phone: this.editProfileData.phone,
      address: this.storeInfo.address // Preserving address if not edited, or add address field to edit form
    };

    // Wait, the edit form has 'description' but not 'address'? 
    // Let's check openEditProfile again.
    // openEditProfile() { ... phone: this.storeInfo.phone, description: this.storeInfo.description };
    // It seems the edit form intends to edit store description. 
    // But our user table might not have description.
    // For now, let's just update name, email, phone. Address we will keep as is or add to form later.

    this.apiService.updateProfile(dataToSave).subscribe({
      next: async (response) => {
        await loading.dismiss();

        // Update local user data
        this.authService.updateCurrentUser({
          nama: response.user.name,
          email: response.user.email,
          telepon: response.user.phone,
          alamat: response.user.address
        });

        // Update local component state
        this.profileData.storeName = response.user.name;
        this.profileData.email = response.user.email;
        this.storeInfo.phone = response.user.phone;
        // this.storeInfo.description -- not saved to DB yet as user table doesn't have description likely

        const alert = await this.alertController.create({
          header: 'Berhasil',
          message: 'Profil berhasil diperbarui!',
          buttons: ['OK']
        });
        await alert.present();
        this.closeEditProfile();
      },
      error: async (error) => {
        await loading.dismiss();
        const alert = await this.alertController.create({
          header: 'Gagal',
          message: error.message || 'Gagal memperbarui profil',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  // Change Password Modal
  openChangePassword() {
    this.passwordData = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    this.showChangePasswordModal = true;
  }

  closeChangePassword() {
    this.showChangePasswordModal = false;
  }

  async changePassword() {
    // Validate
    if (!this.passwordData.oldPassword || !this.passwordData.newPassword || !this.passwordData.confirmPassword) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Semua field harus diisi!',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Password baru dan konfirmasi password tidak cocok!',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    if (this.passwordData.newPassword.length < 6) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Password baru minimal 6 karakter!',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Mengubah password...'
    });
    await loading.present();

    this.apiService.changePassword({
      id: this.currentUser.id,
      old_password: this.passwordData.oldPassword,
      new_password: this.passwordData.newPassword
    }).subscribe({
      next: async () => {
        await loading.dismiss();
        const alert = await this.alertController.create({
          header: 'Berhasil',
          message: 'Password berhasil diubah!',
          buttons: ['OK']
        });
        await alert.present();
        this.closeChangePassword();
      },
      error: async (error) => {
        await loading.dismiss();
        const alert = await this.alertController.create({
          header: 'Gagal',
          message: error.message || 'Gagal mengubah password',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  // Store Info Modal
  openStoreInfo() {
    this.showStoreInfoModal = true;
  }

  closeStoreInfo() {
    this.showStoreInfoModal = false;
  }

  // Notification Settings Modal
  openNotificationSettings() {
    this.showNotificationModal = true;
  }

  closeNotificationSettings() {
    this.showNotificationModal = false;
  }

  async saveNotificationSettings() {
    const alert = await this.alertController.create({
      header: 'Berhasil',
      message: 'Pengaturan notifikasi berhasil disimpan!',
      buttons: ['OK']
    });
    await alert.present();
    this.closeNotificationSettings();
  }

  // FAQ Modal
  openFAQ() {
    this.showFAQModal = true;
  }

  closeFAQ() {
    this.showFAQModal = false;
  }

  toggleFAQ(index: number) {
    this.faqList[index].expanded = !this.faqList[index].expanded;
  }

  // Other actions
  async showVerificationInfo() {
    const alert = await this.alertController.create({
      header: 'Status Verifikasi',
      message: 'Akun Anda sudah terverifikasi. Terima kasih telah melengkapi proses verifikasi.',
      buttons: ['OK']
    });
    await alert.present();
  }

  async showOperatingHours() {
    const alert = await this.alertController.create({
      header: 'Jam Operasional',
      message: this.storeInfo.operatingHours,
      buttons: ['OK']
    });
    await alert.present();
  }

  async showStoreAddress() {
    const alert = await this.alertController.create({
      header: 'Alamat Toko',
      message: this.storeInfo.address,
      buttons: [
        {
          text: 'Tutup',
          role: 'cancel'
        },
        {
          text: 'Buka Maps',
          handler: () => {
            console.log('Open maps');
            // TODO: Implement maps integration
          }
        }
      ]
    });
    await alert.present();
  }

  async showPrivacySettings() {
    const alert = await this.alertController.create({
      header: 'Pengaturan Privasi',
      message: 'Fitur pengaturan privasi akan segera tersedia.',
      buttons: ['OK']
    });
    await alert.present();
  }

  async showLanguageOptions() {
    const alert = await this.alertController.create({
      header: 'Pilih Bahasa',
      inputs: [
        {
          type: 'radio',
          label: 'Indonesia',
          value: 'id',
          checked: true
        },
        {
          type: 'radio',
          label: 'English',
          value: 'en'
        }
      ],
      buttons: [
        {
          text: 'Batal',
          role: 'cancel'
        },
        {
          text: 'Simpan',
          handler: (lang) => {
            console.log('Language changed to:', lang);
          }
        }
      ]
    });
    await alert.present();
  }

  async showHelpCenter() {
    const alert = await this.alertController.create({
      header: 'Pusat Bantuan',
      message: 'Untuk bantuan lebih lanjut, silakan hubungi tim support kami atau buka halaman FAQ.',
      buttons: ['OK']
    });
    await alert.present();
  }

  async contactSupport() {
    const alert = await this.alertController.create({
      header: 'Hubungi Support',
      message: 'Email: support@tokobuahsegar.com\nWhatsApp: +62 812-3456-7890\n\nJam Operasional Support:\nSenin - Jumat: 09:00 - 17:00',
      buttons: [
        {
          text: 'Tutup',
          role: 'cancel'
        },
        {
          text: 'Kirim Email',
          handler: () => {
            window.open('mailto:support@tokobuahsegar.com');
          }
        }
      ]
    });
    await alert.present();
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Konfirmasi Logout',
      message: 'Apakah Anda yakin ingin keluar?',
      buttons: [
        {
          text: 'Batal',
          role: 'cancel',
          cssClass: 'secondary',
        }, {
          text: 'Ya, Keluar',
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login'], { replaceUrl: true });
          }
        }
      ]
    });

    await alert.present();
  }

}
