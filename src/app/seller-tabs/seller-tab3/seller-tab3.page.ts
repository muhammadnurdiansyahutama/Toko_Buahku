import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

interface OrderItem {
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'diproses' | 'dikirim' | 'selesai' | 'dibatalkan';
  orderDate: Date;
  resi?: string;
  shippingAddress: string;
  paymentMethod: string;
  customerNotes?: string;
}

@Component({
  selector: 'app-seller-tab3',
  templateUrl: './seller-tab3.page.html',
  styleUrls: ['./seller-tab3.page.scss'],
  standalone: false,
})
export class SellerTab3Page implements OnInit {
  searchQuery: string = '';
  selectedStatus: string = 'all';

  // Modal state
  showDetailModal: boolean = false;
  selectedOrder: any = null;

  orders: any[] = [];
  filteredOrders: any[] = [];
  currentUser: any;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private apiService: ApiService,
    private authService: AuthService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user && user.role === 'penjual') {
        this.loadOrders();
      }
    });
  }

  ionViewWillEnter() {
    if (this.currentUser && this.currentUser.role === 'penjual') {
      this.loadOrders();
    }
  }

  loadOrders() {
    if (!this.currentUser) return;

    this.apiService.getOrders({ seller_id: this.currentUser.id }).subscribe({
      next: (data) => {
        // Map API data if needed. 
        // Backend statuses: pending, processing, shipped, delivered, cancelled
        // Frontend uses: pending, diproses, dikirim, selesai, dibatalkan
        this.orders = data.map(order => this.mapOrderFromApi(order));
        this.filterOrders();
      },
      error: (error) => console.error('Error loading orders:', error)
    });
  }

  // Helper to map API status to Frontend status
  mapOrderFromApi(order: any): any {
    const statusMap: { [key: string]: string } = {
      'processing': 'diproses',
      'shipped': 'dikirim',
      'delivered': 'selesai',
      'cancelled': 'dibatalkan'
    };

    // Ensure items have correct property names if needed
    // API returns items with product_image, product_name. Frontend uses productName, productImage.
    const mappedItems = (order.items || []).map((item: any) => ({
      ...item,
      productName: item.product_name || item.name || item.productName,
      productImage: item.image || item.productImage || 'assets/images/no-image.png', // Fallback
      price: Number(item.price),
      quantity: Number(item.quantity)
    }));

    return {
      ...order,
      status: statusMap[order.status] || order.status,
      orderNumber: order.order_number || order.orderNumber,
      customerName: order.customer_name || order.customerName,
      customerPhone: order.customer_phone || order.customerPhone,
      totalAmount: Number(order.total),
      orderDate: new Date(order.created_at || order.orderDate),
      items: mappedItems,
      shippingAddress: order.shipping_address || order.shippingAddress,
      paymentMethod: order.payment_method || 'Transfer Bank', // Default if missing
      customerNotes: order.notes || order.customerNotes,
      resi: order.resi
    };
  }

  selectStatus(status: string) {
    this.selectedStatus = status;
    this.filterOrders();
  }

  filterOrders() {
    let filtered = [...this.orders];

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        (order.orderNumber && order.orderNumber.toLowerCase().includes(query)) ||
        (order.customerName && order.customerName.toLowerCase().includes(query)) ||
        (order.customerPhone && order.customerPhone.includes(query))
      );
    }

    // Filter by status
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === this.selectedStatus);
    }

    this.filteredOrders = filtered;
  }

  getOrderCount(status: string): number {
    return this.orders.filter(order => order.status === status).length;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pending',
      'diproses': 'Diproses',
      'dikirim': 'Dikirim',
      'selesai': 'Selesai',
      'dibatalkan': 'Dibatalkan'
    };
    return labels[status] || status;
  }

  // Action: Accept Order (Pending -> Diproses)
  async acceptOrder(order: any, event?: Event) {
    if (event) event.stopPropagation();

    const loading = await this.loadingController.create({ message: 'Memproses pesanan...' });
    await loading.present();

    // Map 'diproses' back to API status 'processing'
    this.apiService.updateOrderStatus(order.id, 'processing').subscribe({
      next: async (res) => {
        await loading.dismiss();
        this.showToast('Pesanan diterima dan sedang diproses');
        this.loadOrders(); // Reload to get fresh state
      },
      error: async (err) => {
        await loading.dismiss();
        this.showToast('Gagal memproses pesanan', 'danger');
      }
    });
  }

  // Action: Reject Order (Pending -> Dibatalkan)
  async rejectOrder(order: any, event?: Event) {
    if (event) event.stopPropagation();

    const alert = await this.alertController.create({
      header: 'Tolak Pesanan',
      subHeader: order.orderNumber,
      inputs: [
        {
          name: 'reason',
          type: 'text',
          placeholder: 'Alasan penolakan (opsional)',
          value: 'Stok habis'
        }
      ],
      buttons: [
        { text: 'Batal', role: 'cancel', cssClass: 'secondary' },
        {
          text: 'Tolak',
          handler: async (data) => {
            const loading = await this.loadingController.create({ message: 'Membatalkan pesanan...' });
            await loading.present();

            // Map 'dibatalkan' back to API status 'cancelled'
            this.apiService.updateOrderStatus(order.id, 'cancelled').subscribe({
              next: async () => {
                await loading.dismiss();
                this.showToast('Pesanan telah ditolak');
                this.loadOrders();
              },
              error: async () => {
                await loading.dismiss();
                this.showToast('Gagal menolak pesanan', 'danger');
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  // Action: Ship Order (Diproses -> Dikirim)
  async markReadyToShip(order: any, event?: Event) {
    if (event) event.stopPropagation();

    const alert = await this.alertController.create({
      header: 'Siap Dikirim',
      message: 'Masukkan nomor resi pengiriman untuk pesanan ini.',
      inputs: [
        {
          name: 'resi',
          type: 'text',
          placeholder: 'Nomor Resi',
          value: 'JNE' + Math.floor(Math.random() * 1000000000)
        }
      ],
      buttons: [
        { text: 'Batal', role: 'cancel', cssClass: 'secondary' },
        {
          text: 'Kirim',
          handler: async (data) => {
            if (data.resi && data.resi.trim()) {
              const loading = await this.loadingController.create({ message: 'Update status pengiriman...' });
              await loading.present();

              // First update status to 'shipped'
              // Note: API doesn't support sending RESI in update-status yet based on my analysis.
              // But typically we should save it. For now, we just update status.
              // Ideally backend should accept resi. 
              // Let's just update status to 'shipped'.

              this.apiService.updateOrderStatus(order.id, 'shipped', data.resi).subscribe({
                next: async () => {
                  await loading.dismiss();
                  this.showToast('Status pesanan diubah menjadi Dikirim');
                  this.loadOrders();
                },
                error: async () => {
                  await loading.dismiss();
                  this.showToast('Gagal mengupdate status', 'danger');
                }
              });
              return true; // Return true to close alert
            } else {
              this.showToast('Nomor resi wajib diisi', 'warning');
              return false; // Return false to keep alert open
            }
          }
        }
      ]
    });
    await alert.present();
  }

  // Action: Complete Order (Dikirim -> Selesai)
  async markCompleted(order: any, event?: Event) {
    if (event) event.stopPropagation();

    const alert = await this.alertController.create({
      header: 'Selesaikan Pesanan',
      message: `Tandai pesanan ${order.orderNumber} sebagai selesai?`,
      buttons: [
        { text: 'Batal', role: 'cancel', cssClass: 'secondary' },
        {
          text: 'Ya, Selesai',
          handler: async () => {
            const loading = await this.loadingController.create({ message: 'Menyelesaikan pesanan...' });
            await loading.present();

            this.apiService.updateOrderStatus(order.id, 'delivered').subscribe({
              next: async () => {
                await loading.dismiss();
                this.showToast('Pesanan selesai!');
                this.loadOrders();
              },
              error: async () => {
                await loading.dismiss();
                this.showToast('Gagal menyelesaikan pesanan', 'danger');
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  openDetailModal(order: any) {
    this.selectedOrder = order;
    this.showDetailModal = true;
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedOrder = null;
  }

  async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  goToNotifications() {
    console.log('Go to notifications');
  }
}
