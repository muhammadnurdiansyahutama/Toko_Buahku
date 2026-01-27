import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-order-detail-modal',
    templateUrl: './order-detail-modal.component.html',
    styleUrls: ['./order-detail-modal.component.scss'],
    standalone: false
})
export class OrderDetailModalComponent implements OnInit {
    @Input() order: any;
    isLoading = false;

    constructor(
        private modalController: ModalController,
        private apiService: ApiService
    ) { }

    ngOnInit() {
        if (this.order && !this.order.items) {
            this.loadFullOrderDetails();
        }
    }

    loadFullOrderDetails() {
        this.isLoading = true;
        this.apiService.getOrder(this.order.id).subscribe({
            next: (fullOrder) => {
                this.order = fullOrder;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading order details:', error);
                this.isLoading = false;
            }
        });
    }

    closeModal() {
        this.modalController.dismiss();
    }

    getStatusColor(status: string): string {
        const colors: { [key: string]: string } = {
            'pending': 'warning',
            'processing': 'primary',
            'shipped': 'secondary',
            'delivered': 'success',
            'cancelled': 'danger'
        };
        return colors[status] || 'medium';
    }

    getStatusLabel(status: string): string {
        const labels: { [key: string]: string } = {
            'pending': 'Menunggu Konfirmasi',
            'processing': 'Sedang Diproses',
            'shipped': 'Sedang Dikirim',
            'delivered': 'Selesai',
            'cancelled': 'Dibatalkan'
        };
        return labels[status] || status;
    }
}
