import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ModalController, AlertController, ToastController } from '@ionic/angular';
import { CheckoutModalComponent } from '../modals/checkout-modal/checkout-modal.component';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: false
})
export class CartPage implements OnInit {
  cartItems: any[] = [];
  isLoading: boolean = false;
  userId: number = 0;

  // Cart calculations
  selectedItemCount: number = 0;
  subtotal: number = 0;
  shippingCost: number = 0; // Free shipping for now
  total: number = 0;

  // Voucher
  appliedVoucher: any = null;

  // Select all
  selectAll: boolean = false;

  constructor(
    private router: Router,
    private location: Location,
    private apiService: ApiService,
    private authService: AuthService,
    private modalController: ModalController,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user && user.id) {
        this.userId = user.id;
        this.loadCart();
      } else {
        this.cartItems = [];
      }
    });
  }

  ionViewWillEnter() {
    if (this.userId > 0) {
      this.loadCart();
    }
  }

  /**
   * Load cart items from API
   */
  loadCart() {
    if (this.userId <= 0) return;
    this.isLoading = true;
    this.apiService.getCart(this.userId).subscribe({
      next: (response) => {
        // response is CartSummary with items array
        const items = response.items || [];
        this.cartItems = items.map((item: any) => ({
          ...item,
          selected: true // Auto-select all items
        }));
        this.isLoading = false;
        this.updateTotal();
      },
      error: (error) => {
        console.error('Error loading cart:', error);
        this.isLoading = false;
        this.showError('Gagal memuat keranjang');
      }
    });
  }

  goBack() {
    this.location.back();
  }

  goToShop() {
    this.router.navigate(['/tabs/tab2']);
  }

  increaseQuantity(item: any) {
    const stock = Number(item.stock) || 99;
    if (item.quantity < stock) {
      item.quantity++;
      this.updateCartItem(item);
    } else {
      this.showError('Stok tidak mencukupi');
    }
  }

  decreaseQuantity(item: any) {
    if (item.quantity > 1) {
      item.quantity--;
      this.updateCartItem(item);
    }
  }

  /**
   * Update cart item quantity in database
   */
  updateCartItem(item: any) {
    this.apiService.updateCartItem(item.id, item.quantity).subscribe({
      next: () => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        item.subtotal = price * quantity;
        this.updateTotal();
      },
      error: (error) => {
        console.error('Error updating cart:', error);
        this.showError('Gagal mengupdate keranjang');
        this.loadCart(); // Reload on error
      }
    });
  }

  async removeItem(item: any) {
    const alert = await this.alertController.create({
      header: 'Hapus Item',
      message: `Hapus ${item.name} dari keranjang?`,
      buttons: [
        {
          text: 'Batal',
          role: 'cancel'
        },
        {
          text: 'Hapus',
          role: 'destructive',
          handler: () => {
            this.apiService.removeFromCart(item.id).subscribe({
              next: () => {
                this.showSuccess('Item berhasil dihapus');
                this.loadCart();
              },
              error: (error) => {
                console.error('Error removing item:', error);
                this.showError('Gagal menghapus item');
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  toggleSelectAll() {
    this.cartItems.forEach(item => {
      item.selected = this.selectAll;
    });
    this.updateTotal();
  }

  /**
   * Update cart total calculations
   */
  updateTotal() {
    // Reset counters
    this.selectedItemCount = 0;
    this.subtotal = 0;

    // Calculate selected items
    this.cartItems.forEach((item: any) => {
      if (item.selected) {
        this.selectedItemCount++;
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        this.subtotal += price * quantity;
      }
    });

    // Calculate total
    this.total = this.subtotal;

    // Apply voucher discount
    if (this.appliedVoucher && this.appliedVoucher.discount) {
      const discount = Number(this.appliedVoucher.discount) || 0;
      this.total = this.total - discount;
    }

    // Add shipping cost
    const shipping = Number(this.shippingCost) || 0;
    this.total = this.total + shipping;

    // Ensure total is not negative
    if (this.total < 0) {
      this.total = 0;
    }

    // Update select all checkbox
    this.selectAll =
      this.cartItems.length > 0 &&
      this.cartItems.every((item: any) => item.selected);
  }

  async selectVoucher() {
    // Fetch active vouchers from API
    this.apiService.getVouchers({ seller_id: 1, status: 'active' }).subscribe({
      next: async (vouchers) => {
        if (vouchers.length === 0) {
          this.showError('Tidak ada voucher tersedia saat ini');
          return;
        }

        // Show voucher selection alert
        const alert = await this.alertController.create({
          header: 'Pilih Voucher',
          inputs: [
            {
              label: 'Tidak pakai voucher',
              type: 'radio' as const,
              value: null,
              checked: this.appliedVoucher === null
            },
            ...vouchers.map((v: any) => ({
              label: `${v.code} - ${v.type === 'nominal' ? 'Rp ' + v.discount.toLocaleString() : v.discount + '%'} (Min. Rp ${v.min_purchase.toLocaleString()})`,
              type: 'radio' as const,
              value: v,
              checked: this.appliedVoucher?.code === v.code
            }))
          ],
          buttons: [
            {
              text: 'Batal',
              role: 'cancel'
            },
            {
              text: 'Pilih',
              handler: (selected) => {
                if (selected === null) {
                  this.appliedVoucher = null;
                } else {
                  // Validate minimum purchase
                  if (this.subtotal < selected.min_purchase) {
                    this.showError(`Minimum pembelian untuk voucher ini adalah Rp ${selected.min_purchase.toLocaleString()}`);
                    return false;
                  }

                  // Calculate discount
                  let discountAmount = 0;
                  if (selected.type === 'nominal') {
                    discountAmount = Number(selected.discount) || 0;
                  } else {
                    discountAmount = (this.subtotal * Number(selected.discount)) / 100;
                    if (selected.max_discount && discountAmount > Number(selected.max_discount)) {
                      discountAmount = Number(selected.max_discount);
                    }
                  }

                  this.appliedVoucher = {
                    code: selected.code,
                    discount: discountAmount
                  };
                  this.showSuccess(`Voucher ${selected.code} berhasil diterapkan!`);
                }
                this.updateTotal();
                return true;
              }
            }
          ]
        });
        await alert.present();
      },
      error: (error) => {
        console.error('Error fetching vouchers:', error);
        this.showError('Gagal memuat voucher');
      }
    });
  }

  async checkout() {
    // Get selected items
    const selectedItems = this.cartItems.filter(item => item.selected);

    if (selectedItems.length === 0) {
      this.showError('Pilih minimal 1 item untuk checkout');
      return;
    }

    // Open checkout modal
    const modal = await this.modalController.create({
      component: CheckoutModalComponent,
      componentProps: {
        cartItems: selectedItems,
        subtotal: this.subtotal,
        shippingCost: this.shippingCost,
        voucher: this.appliedVoucher,
        total: this.total,
        userId: this.userId
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data && data.success) {
      // Order created successfully
      this.appliedVoucher = null;
      this.loadCart(); // Reload cart
      this.router.navigate(['/tabs/tab3']); // Navigate to orders
    }
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
