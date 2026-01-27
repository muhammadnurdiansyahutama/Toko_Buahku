import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastController, ModalController } from '@ionic/angular';
import { OrderDetailModalComponent } from '../modals/order-detail-modal/order-detail-modal.component';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page implements OnInit {
  selectedStatus: string = 'all';
  orders: any[] = [];
  filteredOrders: any[] = [];
  isLoading: boolean = true;
  userId: number = 0;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private toastController: ToastController,
    private modalController: ModalController
  ) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user && user.id) {
        this.userId = user.id;
        this.loadOrders();
      } else {
        // Handle not logged in or logout
        this.orders = [];
        this.filteredOrders = [];
      }
    });
  }

  ionViewWillEnter() {
    // Refresh orders when entering tab if user is logged in
    if (this.userId > 0) {
      this.loadOrders();
    }
  }

  /**
   * Load orders from API
   */
  loadOrders() {
    if (this.userId <= 0) return;

    this.isLoading = true;
    this.apiService.getOrders(this.userId).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.filterOrders();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.showError('Gagal memuat pesanan');
        this.isLoading = false;
      }
    });
  }

  /**
   * Refresh orders (pull-to-refresh)
   */
  doRefresh(event: any) {
    this.loadOrders();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  selectStatus(status: string) {
    this.selectedStatus = status;
    this.filterOrders();
  }

  filterOrders() {
    if (this.selectedStatus === 'all') {
      this.filteredOrders = [...this.orders];
    } else {
      this.filteredOrders = this.orders.filter(order => order.status === this.selectedStatus);
    }

    // Sort by date, newest first
    this.filteredOrders.sort((a, b) => {
      const dateA = new Date(a.order_date || a.created_at).getTime();
      const dateB = new Date(b.order_date || b.created_at).getTime();
      return dateB - dateA;
    });
  }

  getOrderCount(status: string): number {
    if (status === 'all') {
      return this.orders.length;
    }
    return this.orders.filter(order => order.status === status).length;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Menunggu',
      'processing': 'Diproses',
      'shipped': 'Dikirim',
      'delivered': 'Selesai',
      'cancelled': 'Dibatalkan'
    };
    return labels[status] || status;
  }

  getEmptyIcon(): string {
    const icons: { [key: string]: string } = {
      'all': 'receipt-outline',
      'pending': 'time-outline',
      'processing': 'hourglass-outline',
      'shipped': 'car-outline',
      'delivered': 'checkmark-circle-outline',
      'cancelled': 'close-circle-outline'
    };
    return icons[this.selectedStatus] || 'receipt-outline';
  }

  getEmptyTitle(): string {
    const titles: { [key: string]: string } = {
      'all': 'Belum Ada Pesanan',
      'pending': 'Tidak Ada Pesanan Menunggu',
      'processing': 'Tidak Ada Pesanan Diproses',
      'shipped': 'Tidak Ada Pesanan Dikirim',
      'delivered': 'Tidak Ada Pesanan Selesai',
      'cancelled': 'Tidak Ada Pesanan Dibatalkan'
    };
    return titles[this.selectedStatus] || 'Tidak Ada Pesanan';
  }

  getEmptyMessage(): string {
    const messages: { [key: string]: string } = {
      'all': 'Yuk mulai belanja buah segar favorit Anda!',
      'pending': 'Pesanan yang menunggu konfirmasi akan muncul di sini',
      'processing': 'Pesanan yang sedang diproses akan muncul di sini',
      'shipped': 'Pesanan yang sedang dikirim akan muncul di sini',
      'delivered': 'Riwayat pesanan yang selesai akan muncul di sini',
      'cancelled': 'Pesanan yang dibatalkan akan muncul di sini'
    };
    return messages[this.selectedStatus] || '';
  }



  async viewOrderDetail(order: any) {
    const modal = await this.modalController.create({
      component: OrderDetailModalComponent,
      componentProps: {
        order: order
      }
    });
    return await modal.present();
  }



  async reorder(order: any, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    // Add all items from order to cart
    if (order.items && order.items.length > 0) {
      const loading = await this.toastController.create({
        message: 'Sedang menambahkan ke keranjang...',
        duration: 3000, // Fallback
        position: 'bottom'
      });
      await loading.present();

      let addedCount = 0;
      let errorCount = 0;

      // Use a loop with await to ensure sequential adding (optional but safer for simple APIs)
      // or Promise.all for parallel
      const promises = order.items.map((item: any) =>
        this.apiService.addToCart(this.userId, item.product_id, item.quantity).toPromise()
          .then(() => addedCount++)
          .catch(() => errorCount++)
      );

      await Promise.all(promises);

      loading.dismiss();

      if (addedCount > 0) {
        this.showSuccess(`${addedCount} item berhasil ditambahkan ke keranjang`);
        this.router.navigate(['/tabs/tab2']); // Navigate to catalog first to trigger refresh maybe? or straight to cart
        setTimeout(() => {
          this.router.navigate(['/cart']);
        }, 100);

      } else {
        this.showError('Gagal menambahkan item ke keranjang');
      }
    }
  }

  async leaveReview(order: any, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    // Ensure we have items populated
    if (!order.items || order.items.length === 0) {
      // Try to fetch order details if items are missing
      this.apiService.getOrderById(order.id).subscribe({
        next: async (fullOrder) => {
          await this.openReviewModal(fullOrder);
        },
        error: () => {
          this.showError('Gagal memuat detail pesanan');
        }
      });
    } else {
      await this.openReviewModal(order);
    }
  }

  async openReviewModal(order: any) {
    const modal = await this.modalController.create({
      component: await import('../modals/review-modal/review-modal.component').then(m => m.ReviewModalComponent),
      componentProps: {
        order: order
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data && data.hasSubmitted) {
      // Refresh? Or just let it be.
    }
  }

  cancelOrder(order: any, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    console.log('Cancel order:', order.order_number);
    // TODO: Show confirmation and cancel order
  }

  goToShop() {
    this.router.navigate(['/tabs/tab2']);
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
