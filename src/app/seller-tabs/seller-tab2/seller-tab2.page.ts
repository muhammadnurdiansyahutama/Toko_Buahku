import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-seller-tab2',
  templateUrl: './seller-tab2.page.html',
  styleUrls: ['./seller-tab2.page.scss'],
  standalone: false,
})
export class SellerTab2Page implements OnInit {
  selectedSegment: string = 'products';

  // Products data
  searchQuery: string = '';
  selectedCategory: string = 'all';

  products: any[] = [];
  categories: any[] = [];
  filteredProducts: any[] = [];
  currentUser: any;

  // Product Form
  showingProductModal: boolean = false;
  editingProduct: any = null;
  productForm: any = {
    name: '',
    category_id: '',
    price: 0,
    stock: 0,
    status: 'active',
    image: 'assets/fruits/apple.jpg',
    description: ''
  };

  // Vouchers data (keeping mock for now as per plan focus on products first, or can sync later)
  selectedVoucherStatus: string = 'all';
  vouchers: any[] = []; // Initialize empty or keep mock if needed. Keeping mock for visuals unless API exists.

  // Voucher Form (keeping existing logic for now)
  showingVoucherModal: boolean = false;
  editingVoucher: any = null;
  voucherForm: any = {
    code: '',
    type: 'nominal',
    discount: 0,
    minPurchase: 0,
    quota: 0,
    startDate: '',
    endDate: '',
    status: 'active',
    used: 0
  };

  constructor(
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user && user.role === 'penjual') {
        this.loadCategories();
        this.loadProducts();
        this.loadVouchers();
      }
    });
  }

  loadCategories() {
    this.apiService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (error) => console.error('Error loading categories:', error)
    });
  }

  loadProducts() {
    if (!this.currentUser) return;

    this.apiService.getProducts({ seller_id: this.currentUser.id }).subscribe({
      next: (data) => {
        this.products = data;
        this.filterProducts();
      },
      error: (error) => console.error('Error loading products:', error)
    });
  }

  segmentChanged() {
    console.log('Segment changed to:', this.selectedSegment);
  }

  // Products methods
  selectCategory(category: string) {
    this.selectedCategory = category;
    this.filterProducts();
  }

  filterProducts() {
    let filtered = [...this.products];

    // Filter by search
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.category_name && p.category_name.toLowerCase().includes(query))
      );
    }

    // Filter by category/status chips
    if (this.selectedCategory === 'active') {
      filtered = filtered.filter(p => p.status === 'active');
    } else if (this.selectedCategory === 'inactive') {
      filtered = filtered.filter(p => p.status === 'inactive');
    } else if (this.selectedCategory === 'lowstock') {
      filtered = filtered.filter(p => p.stock < 10);
    } else if (this.selectedCategory !== 'all') {
      // If we implement category selection by ID or Name from chips in future
    }

    this.filteredProducts = filtered;
  }

  getProductCount(type: string): number {
    if (type === 'active') {
      return this.products.filter(p => p.status === 'active').length;
    } else if (type === 'inactive') {
      return this.products.filter(p => p.status === 'inactive').length;
    } else if (type === 'lowstock') {
      return this.products.filter(p => p.stock < 10).length;
    }
    return 0;
  }

  async toggleStatus(product: any, event?: Event) {
    if (event) event.stopPropagation();

    const loading = await this.loadingController.create({
      message: 'Mengupdate status...',
      duration: 2000
    });
    await loading.present();

    this.apiService.toggleProductStatus(product.id).subscribe({
      next: async (res) => {
        await loading.dismiss();
        product.status = res.status;
        this.showToast(`Status produk diubah menjadi ${res.status}`);
        this.filterProducts(); // Refresh filter counts
      },
      error: async (err) => {
        await loading.dismiss();
        this.showToast('Gagal mengubah status', 'danger');
      }
    });
  }

  showProductForm() {
    this.editingProduct = null;
    this.productForm = {
      name: '',
      category_id: '',
      price: 0,
      stock: 0,
      status: 'active',
      image: 'assets/fruits/apple.jpg',
      description: ''
    };
    this.showingProductModal = true;
  }

  editProduct(product: any, event?: Event) {
    if (event) event.stopPropagation();
    this.editingProduct = product;
    this.productForm = {
      name: product.name,
      category_id: product.category_id,
      price: product.price,
      stock: product.stock,
      status: product.status,
      image: product.image,
      description: product.description
    };
    this.showingProductModal = true;
  }

  closeProductForm() {
    this.showingProductModal = false;
    this.editingProduct = null;
  }

  async saveProduct() {
    if (!this.productForm.name || !this.productForm.category_id || !this.productForm.price) {
      this.showToast('Harap lengkapi semua field yang wajib diisi!', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: this.editingProduct ? 'Mengupdate produk...' : 'Menyimpan produk...'
    });
    await loading.present();

    if (this.editingProduct) {
      // Update existing product
      this.apiService.updateProduct(this.editingProduct.id, this.productForm).subscribe({
        next: async (res) => {
          await loading.dismiss();
          this.showToast('Produk berhasil diupdate!');
          this.loadProducts(); // Reload list
          this.closeProductForm();
        },
        error: async (err) => {
          await loading.dismiss();
          this.showToast('Gagal mengupdate produk', 'danger');
        }
      });
    } else {
      // Add new product
      const newProduct = {
        ...this.productForm,
        seller_id: this.currentUser.id
      };

      this.apiService.addProduct(newProduct).subscribe({
        next: async (res) => {
          await loading.dismiss();
          this.showToast('Produk baru berhasil ditambahkan!');
          this.loadProducts(); // Reload list
          this.closeProductForm();
        },
        error: async (err) => {
          await loading.dismiss();
          this.showToast('Gagal menambahkan produk', 'danger');
        }
      });
    }
  }

  async deleteProduct(product: any, event?: Event) {
    if (event) event.stopPropagation();

    const alert = await this.alertController.create({
      header: 'Konfirmasi Hapus',
      message: `Apakah Anda yakin ingin menghapus produk <b>${product.name}</b>?`,
      buttons: [
        {
          text: 'Batal',
          role: 'cancel'
        },
        {
          text: 'Hapus',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingController.create({ message: 'Menghapus produk...' });
            await loading.present();

            this.apiService.deleteProduct(product.id).subscribe({
              next: async () => {
                await loading.dismiss();
                this.showToast('Produk berhasil dihapus');
                this.loadProducts();
              },
              error: async (err) => {
                await loading.dismiss();
                this.showToast('Gagal menghapus produk', 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  loadVouchers() {
    if (!this.currentUser) return;

    this.apiService.getVouchers({ seller_id: this.currentUser.id }).subscribe({
      next: (data) => {
        // Map API fields (snake_case) to frontend (camelCase) if needed
        this.vouchers = data.map((v: any) => ({
          ...v,
          minPurchase: v.min_purchase,
          maxDiscount: v.max_discount,
          startDate: v.start_date,
          endDate: v.end_date
        }));
      },
      error: (error) => console.error('Error loading vouchers:', error)
    });
  }

  // Vouchers methods
  getVoucherCount(status: string): number {
    return this.vouchers.filter(v => v.status === status).length;
  }

  getFilteredVouchers() {
    if (this.selectedVoucherStatus === 'all') {
      return this.vouchers;
    }
    return this.vouchers.filter(v => v.status === this.selectedVoucherStatus);
  }

  getVoucherStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'active': 'Aktif',
      'scheduled': 'Terjadwal',
      'expired': 'Kadaluarsa'
    };
    return labels[status] || status;
  }

  async toggleVoucherStatus(voucher: any, event?: Event) {
    if (event) event.stopPropagation();

    // Determine new status (simple toggle for Active/Inactive, Scheduled might be tricky)
    // If active -> inactive. If inactive -> active. If scheduled/expired, maybe can't toggle easily or just set inactive.
    const newStatus = voucher.status === 'active' ? 'inactive' : 'active';

    // We update the voucher with new status
    const updateData = { status: newStatus };

    const loading = await this.loadingController.create({ message: 'Mengupdate status voucher...' });
    await loading.present();

    this.apiService.updateVoucher(voucher.id, updateData).subscribe({
      next: async (res) => {
        await loading.dismiss();
        voucher.status = res.status; // Update local
        this.showToast(`Status voucher diubah menjadi ${res.status}`);
      },
      error: async (err) => {
        await loading.dismiss();
        this.showToast('Gagal mengubah status voucher', 'danger');
      }
    });
  }

  showVoucherForm() {
    this.editingVoucher = null;
    this.voucherForm = {
      code: '',
      type: 'nominal',
      discount: 0,
      minPurchase: 0,
      quota: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
      status: 'active',
      used: 0
    };
    this.showingVoucherModal = true;
  }

  editVoucher(voucher: any, event?: Event) {
    if (event) event.stopPropagation();
    this.editingVoucher = voucher;

    // Use raw date strings from API or convert Date objects
    // API sends YYYY-MM-DD strings usually.
    let startDateStr = voucher.startDate;
    if (voucher.startDate instanceof Date) {
      startDateStr = voucher.startDate.toISOString().split('T')[0];
    }
    let endDateStr = voucher.endDate;
    if (voucher.endDate instanceof Date) {
      endDateStr = voucher.endDate.toISOString().split('T')[0];
    }

    this.voucherForm = {
      code: voucher.code,
      type: voucher.type,
      discount: voucher.discount,
      minPurchase: voucher.minPurchase,
      quota: voucher.quota,
      status: voucher.status,
      used: voucher.used,
      startDate: startDateStr,
      endDate: endDateStr
    };
    this.showingVoucherModal = true;
  }

  closeVoucherForm() {
    this.showingVoucherModal = false;
    this.editingVoucher = null;
  }

  async saveVoucher() {
    if (!this.voucherForm.code || !this.voucherForm.discount || !this.voucherForm.minPurchase) {
      this.showToast('Harap lengkapi semua field yang wajib diisi!', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: this.editingVoucher ? 'Mengupdate voucher...' : 'Menyimpan voucher...'
    });
    await loading.present();

    // Prepare data for API (snake_case)
    const apiData = {
      seller_id: this.currentUser.id,
      code: this.voucherForm.code,
      type: this.voucherForm.type,
      discount: this.voucherForm.discount,
      min_purchase: this.voucherForm.minPurchase,
      quota: this.voucherForm.quota,
      start_date: this.voucherForm.startDate,
      end_date: this.voucherForm.endDate,
      status: this.voucherForm.status
    };

    if (this.editingVoucher) {
      // Update existing voucher
      this.apiService.updateVoucher(this.editingVoucher.id, apiData).subscribe({
        next: async (res) => {
          await loading.dismiss();
          this.showToast('Voucher berhasil diupdate!');
          this.loadVouchers();
          this.closeVoucherForm();
        },
        error: async (err) => {
          await loading.dismiss();
          this.showToast(err.message || 'Gagal mengupdate voucher', 'danger');
        }
      });
    } else {
      // Add new voucher
      this.apiService.addVoucher(apiData).subscribe({
        next: async (res) => {
          await loading.dismiss();
          this.showToast('Voucher baru berhasil ditambahkan!');
          this.loadVouchers();
          this.closeVoucherForm();
        },
        error: async (err) => {
          await loading.dismiss();
          this.showToast(err.message || 'Gagal menambahkan voucher', 'danger');
        }
      });
    }
  }

  async deleteVoucher(voucher: any, event?: Event) {
    if (event) event.stopPropagation();

    const alert = await this.alertController.create({
      header: 'Konfirmasi Hapus',
      message: `Apakah Anda yakin ingin menghapus voucher <b>${voucher.code}</b>?`,
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Hapus',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingController.create({ message: 'Menghapus voucher...' });
            await loading.present();

            this.apiService.deleteVoucher(voucher.id).subscribe({
              next: async () => {
                await loading.dismiss();
                this.showToast('Voucher berhasil dihapus');
                this.loadVouchers();
              },
              error: async (err) => {
                await loading.dismiss();
                this.showToast('Gagal menghapus voucher', 'danger');
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  goToNotifications() {
    console.log('Go to notifications');
  }
}
