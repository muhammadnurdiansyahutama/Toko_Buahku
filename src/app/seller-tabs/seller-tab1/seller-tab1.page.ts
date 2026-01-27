import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-seller-tab1',
  templateUrl: './seller-tab1.page.html',
  styleUrls: ['./seller-tab1.page.scss'],
  standalone: false,
})
export class SellerTab1Page implements OnInit {
  // Stats
  todaySales: number = 1250000;
  salesChange: number = 12.5;
  newOrders: number = 8;
  monthlyRevenue: number = 35400000;
  revenueChange: number = 18.3;
  activeProducts: number = 42;
  totalProducts: number = 48;

  // Top Products
  topProducts = [
    { rank: 1, name: 'Apel Fuji', sold: 245, revenue: 11025000, image: 'assets/fruits/apple.jpg' },
    { rank: 2, name: 'Jeruk Pontianak', sold: 189, revenue: 6615000, image: 'assets/fruits/orange.jpg' },
    { rank: 3, name: 'Mangga Harum Manis', sold: 156, revenue: 8580000, image: 'assets/fruits/mango.jpg' },
    { rank: 4, name: 'Anggur Hijau', sold: 98, revenue: 8330000, image: 'assets/fruits/grape.jpg' },
    { rank: 5, name: 'Strawberry', sold: 87, revenue: 5655000, image: 'assets/fruits/strawberry.jpg' }
  ];

  // Recent Orders
  recentOrders = [
    {
      orderNumber: '2026011401',
      date: new Date('2026-01-14T10:30:00'),
      customerName: 'Budi Santoso',
      itemsCount: 3,
      total: 180000,
      status: 'pending'
    },
    {
      orderNumber: '2026011402',
      date: new Date('2026-01-14T09:45:00'),
      customerName: 'Siti Aminah',
      itemsCount: 2,
      total: 140000,
      status: 'processing'
    },
    {
      orderNumber: '2026011403',
      date: new Date('2026-01-14T08:20:00'),
      customerName: 'Ahmad Ridwan',
      itemsCount: 5,
      total: 325000,
      status: 'processing'
    },
    {
      orderNumber: '2026011404',
      date: new Date('2026-01-13T16:10:00'),
      customerName: 'Dewi Lestari',
      itemsCount: 2,
      total: 95000,
      status: 'shipped'
    },
    {
      orderNumber: '2026011405',
      date: new Date('2026-01-13T14:30:00'),
      customerName: 'Joko Widodo',
      itemsCount: 4,
      total: 250000,
      status: 'delivered'
    }
  ];

  // Alerts
  lowStockProducts = ['Kiwi', 'Pisang Cavendish', 'Nanas Madu'];
  newReviews: number = 3;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    // Get seller ID from AuthService
    // For simplicity in loadDashboardData which is called once, I can subscribe.
    this.authService.currentUser$.subscribe(user => {
      if (user && user.role === 'penjual' && user.id) {
        this.fetchDashboardData(user.id);
      }
    });
  }

  fetchDashboardData(sellerId: number) {
    this.apiService.getSellerDashboard(sellerId).subscribe({
      next: (data: any) => {
        this.todaySales = data.today_sales || 0;
        this.salesChange = data.sales_change || 0;
        this.monthlyRevenue = data.monthly_revenue || 0;
        this.revenueChange = data.revenue_change || 0;
        this.newOrders = data.new_orders || 0;
        this.activeProducts = data.active_products || 0;
        this.totalProducts = data.total_products || 0;
        this.newReviews = data.new_reviews || 0;

        if (data.top_products) {
          this.topProducts = data.top_products.map((p: any) => ({
            ...p,
            image: p.image || 'assets/fruits/default.jpg'
          }));
        }

        if (data.recent_orders) {
          this.recentOrders = data.recent_orders.map((o: any) => ({
            orderNumber: o.order_number,
            date: new Date(o.created_at),
            customerName: o.customer_name_full || o.customer_name || 'Pelanggan',
            itemsCount: o.items_count,
            total: o.final_total,
            status: o.status
          }));
        }

        if (data.low_stock_products) {
          this.lowStockProducts = data.low_stock_products.map((p: any) => p.name);
        }
      },
      error: (error: any) => {
        console.error('Error loading dashboard:', error);
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pending',
      'processing': 'Diproses',
      'shipped': 'Dikirim',
      'delivered': 'Selesai',
      'cancelled': 'Dibatalkan'
    };
    return labels[status] || status;
  }

  goToOrders() {
    this.router.navigate(['/seller-tabs/seller-tab3']);
  }

  viewOrder(order: any) {
    console.log('View order:', order.orderNumber);
    // TODO: Navigate to order detail
  }
}
