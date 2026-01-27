import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { ApiService, Category, Product } from '../services/api.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit, OnDestroy {
  searchQuery: string = '';
  cartItemCount: number = 0;
  currentBannerIndex: number = 0;
  bannerInterval: any;
  userId: number = 0;

  isLoading: boolean = true;
  loadingCategories: boolean = true;
  loadingProducts: boolean = true;

  banners = [
    {
      title: 'Diskon 50%',
      subtitle: 'Untuk semua buah tropis!',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      icon: 'leaf'
    },
    {
      title: 'Buah Segar',
      subtitle: 'Langsung dari kebun',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      icon: 'heart'
    },
    {
      title: 'Gratis Ongkir',
      subtitle: 'Minimal pembelian Rp 100.000',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      icon: 'car'
    }
  ];

  categories: Category[] = [];
  featuredProducts: Product[] = [];
  newArrivals: Product[] = [];

  constructor(
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user && user.id) {
        this.userId = user.id;
        this.loadCartCount();
      } else {
        this.userId = 0;
        this.cartItemCount = 0;
      }
    });

    this.loadData();
    this.startBannerRotation();
  }

  ngOnDestroy() {
    if (this.bannerInterval) {
      clearInterval(this.bannerInterval);
    }
  }

  /**
   * Load all data from API
   */
  loadData() {
    this.isLoading = true;
    this.loadCategories();
    this.loadProducts();
  }

  /**
   * Load categories from API
   */
  loadCategories() {
    this.loadingCategories = true;
    this.apiService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loadingCategories = false;
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.loadingCategories = false;
        this.checkLoadingComplete();
        this.showError('Gagal memuat kategori');
      }
    });
  }

  /**
   * Load products from API
   */
  loadProducts() {
    this.loadingProducts = true;
    this.apiService.getProducts({ status: 'active' }).subscribe({
      next: (products) => {
        // Featured products (products with discount)
        this.featuredProducts = products
          .filter(p => p.discount > 0)
          .slice(0, 4);

        // If not enough products with discount, add regular products
        if (this.featuredProducts.length < 4) {
          const remaining = products
            .filter(p => p.discount === 0)
            .slice(0, 4 - this.featuredProducts.length);
          this.featuredProducts = [...this.featuredProducts, ...remaining];
        }

        // New arrivals (latest products by id)
        this.newArrivals = products
          .sort((a, b) => b.id - a.id)
          .slice(0, 4);

        this.loadingProducts = false;
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.loadingProducts = false;
        this.checkLoadingComplete();
        this.showError('Gagal memuat produk');
      }
    });
  }

  /**
   * Load cart item count
   */
  loadCartCount() {
    if (this.userId <= 0) return;

    this.apiService.getCart(this.userId).subscribe({
      next: (cart) => {
        this.cartItemCount = cart.summary.total_items;
      },
      error: (error) => {
        console.error('Error loading cart:', error);
      }
    });
  }

  /**
   * Check if all data loading is complete
   */
  checkLoadingComplete() {
    this.isLoading = this.loadingCategories || this.loadingProducts;
  }

  /**
   * Refresh data (pull-to-refresh)
   */
  doRefresh(event: any) {
    this.loadData();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  startBannerRotation() {
    this.bannerInterval = setInterval(() => {
      this.currentBannerIndex = (this.currentBannerIndex + 1) % this.banners.length;
    }, 4000);
  }

  selectBanner(index: number) {
    this.currentBannerIndex = index;
    if (this.bannerInterval) {
      clearInterval(this.bannerInterval);
    }
    this.startBannerRotation();
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/tabs/tab2'], {
        queryParams: { search: this.searchQuery }
      });
    }
  }

  goToCart() {
    this.router.navigate(['/cart']);
  }

  selectCategory(category: Category) {
    this.router.navigate(['/tabs/tab2'], {
      queryParams: { category: category.name }
    });
  }

  viewAllCategories() {
    this.router.navigate(['/tabs/tab2']);
  }

  viewAllProducts() {
    this.router.navigate(['/tabs/tab2']);
  }

  viewProductDetail(product: Product) {
    console.log('View product:', product.name);
    // TODO: Navigate to product detail page
  }

  async addToCart(product: Product, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    // Check stock
    if (product.stock <= 0) {
      this.showError('Produk tidak tersedia');
      return;
    }

    if (this.userId <= 0) {
      this.showError('Silakan login untuk belanja');
      return;
    }

    this.apiService.addToCart(this.userId, product.id, 1).subscribe({
      next: () => {
        this.cartItemCount++;
        this.showSuccess(`${product.name} ditambahkan ke keranjang`);
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        this.showError('Gagal menambahkan ke keranjang');
      }
    });
  }

  /**
   * Show success toast
   */
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

  /**
   * Show error toast
   */
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
