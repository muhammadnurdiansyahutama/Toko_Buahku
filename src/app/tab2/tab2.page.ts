import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { ApiService, Category, Product } from '../services/api.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit {
  searchQuery: string = '';
  cartItemCount: number = 0;
  selectedCategory: string = '';
  sortBy: string = 'default';
  showFilter: boolean = false;
  isLoading: boolean = true;
  userId: number = 0;

  // Filter options
  priceMin: number | null = null;
  priceMax: number | null = null;
  minRating: number | null = null;
  inStockOnly: boolean = false;

  categories: string[] = [];
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
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

    // Check for query params from Tab1
    this.route.queryParams.subscribe(params => {
      if (params['category']) {
        this.selectedCategory = params['category'];
      }
      if (params['search']) {
        this.searchQuery = params['search'];
      }

      // Apply filters if params present
      if (params['category'] || params['search']) {
        setTimeout(() => {
          this.applyFilters();
        }, 500);
      }
    });
  }

  /**
   * Load data from API
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
    this.apiService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories.map(c => c.name);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.showError('Gagal memuat kategori');
      }
    });
  }

  /**
   * Load products from API
   */
  loadProducts() {
    this.isLoading = true;
    this.apiService.getProducts({ status: 'active' }).subscribe({
      next: (products) => {
        this.allProducts = products.map(p => ({
          ...p,
          category: p.category_name || '',
          original_price: p.original_price || 0,
          reviews: Math.floor(Math.random() * 200) + 50 // Mock reviews count
        }));
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isLoading = false;
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
   * Refresh data (pull-to-refresh)
   */
  doRefresh(event: any) {
    this.loadData();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  onSearch() {
    this.applyFilters();
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.applyFilters();
  }

  onSort() {
    let products = [...this.filteredProducts];

    switch (this.sortBy) {
      case 'name-asc':
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        products.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        products.sort((a, b) => b.rating - a.rating);
        break;
    }

    this.filteredProducts = products;
  }

  applyFilters() {
    let products = [...this.allProducts];

    // Filter by search query
    if (this.searchQuery && this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        (p.category && p.category.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (this.selectedCategory) {
      products = products.filter(p => p.category === this.selectedCategory);
    }

    // Filter by price range
    if (this.priceMin !== null && this.priceMin > 0) {
      products = products.filter(p => p.price >= this.priceMin!);
    }
    if (this.priceMax !== null && this.priceMax > 0) {
      products = products.filter(p => p.price <= this.priceMax!);
    }

    // Filter by minimum rating
    if (this.minRating !== null) {
      products = products.filter(p => p.rating >= this.minRating!);
    }

    // Filter by stock availability
    if (this.inStockOnly) {
      products = products.filter(p => p.stock > 0);
    }

    this.filteredProducts = products;
    this.onSort(); // Apply sorting after filtering

    if (this.showFilter) {
      this.toggleFilter();
    }
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.sortBy = 'default';
    this.priceMin = null;
    this.priceMax = null;
    this.minRating = null;
    this.inStockOnly = false;
    this.applyFilters();
  }

  toggleFilter() {
    this.showFilter = !this.showFilter;
  }

  goToCart() {
    this.router.navigate(['/cart']);
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
