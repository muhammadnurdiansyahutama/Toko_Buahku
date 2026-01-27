import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-checkout-modal',
    templateUrl: './checkout-modal.component.html',
    styleUrls: ['./checkout-modal.component.scss'],
    standalone: false
})
export class CheckoutModalComponent implements OnInit {
    @Input() cartItems: any[] = [];
    @Input() subtotal: number = 0;
    @Input() shippingCost: number = 0;
    @Input() voucher: any = null;
    @Input() total: number = 0;
    @Input() userId: number = 0;

    currentStep: number = 1;
    totalSteps: number = 5;

    // User info (read-only)
    userName: string = '';
    userPhone: string = '';
    userEmail: string = '';
    userAddress: string = '';

    // Shipping address
    shippingAddress: string = '';
    notes: string = '';

    // Payment method
    paymentMethod: string = '';
    paymentMethods = [
        { value: 'cod', label: 'Cash on Delivery (COD)', icon: 'cash-outline', description: 'Bayar saat barang tiba' },
        { value: 'transfer', label: 'Transfer Bank', icon: 'card-outline', description: 'BCA, Mandiri, BNI' },
        { value: 'ewallet', label: 'E-Wallet', icon: 'wallet-outline', description: 'GoPay, OVO, Dana' }
    ];

    // Order result
    orderNumber: string = '';
    isProcessing: boolean = false;

    constructor(
        private modalController: ModalController,
        private apiService: ApiService,
        private authService: AuthService,
        private toastController: ToastController
    ) { }

    ngOnInit() {
        this.loadUserInfo();
    }

    /**
     * Load user info from AuthService
     */
    loadUserInfo() {
        const user = this.authService.getCurrentUserValue();
        if (user) {
            this.userName = user.nama;
            this.userPhone = user.telepon;
            this.userEmail = user.email;
            this.userAddress = user.alamat;
        } else {
            // Mock data for now
            this.userName = 'Budi Santoso';
            this.userPhone = '08123456789';
            this.userEmail = 'budi@test.com';
            this.userAddress = 'Jl. Merdeka No. 123';
        }
    }

    /**
     * Close modal
     */
    dismiss(success: boolean = false) {
        this.modalController.dismiss({
            success: success,
            orderNumber: this.orderNumber
        });
    }

    /**
     * Go to next step
     */
    nextStep() {
        if (this.validateStep()) {
            if (this.currentStep === 4) {
                // Final step - create order
                this.createOrder();
            } else {
                this.currentStep++;
            }
        }
    }

    /**
     * Go to previous step
     */
    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
        }
    }

    /**
     * Validate current step
     */
    validateStep(): boolean {
        switch (this.currentStep) {
            case 1:
                // User info is read-only, always valid
                return true;
            case 2:
                if (!this.shippingAddress || this.shippingAddress.trim().length < 10) {
                    this.showError('Alamat pengiriman minimal 10 karakter');
                    return false;
                }
                return true;
            case 3:
                if (!this.paymentMethod) {
                    this.showError('Pilih metode pembayaran');
                    return false;
                }
                return true;
            case 4:
                // Confirmation step
                return true;
            default:
                return true;
        }
    }

    /**
     * Create order via API
     */
    createOrder() {
        this.isProcessing = true;

        const orderData = {
            user_id: this.userId,
            seller_id: 1, // Mock seller ID
            customer_name: this.userName,
            customer_phone: this.userPhone,
            shipping_address: this.shippingAddress,
            notes: this.notes || '',
            voucher_code: this.voucher?.code,
            payment_method: this.paymentMethod,
            items: this.cartItems.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price
            }))
        };

        this.apiService.createOrder(orderData).subscribe({
            next: (response) => {
                // API returns response.data with order_number
                if (response && response.order_number) {
                    this.orderNumber = response.order_number;
                } else if (response && response.data && response.data.order_number) {
                    this.orderNumber = response.data.order_number;
                } else {
                    // Fallback: generate mock order number
                    this.orderNumber = 'ORD-' + Date.now();
                }
                this.currentStep = 5; // Success step
                this.isProcessing = false;
            },
            error: (error) => {
                console.error('API error:', error);

                // Show real error from API
                const errorMessage = error.error?.message || error.message || 'Gagal membuat pesanan. Silakan coba lagi.';
                this.showError(errorMessage);

                this.isProcessing = false;
            }
        });
    }

    /**
     * Get step title
     */
    getStepTitle(): string {
        const titles = [
            '',
            'Informasi Pembeli',
            'Alamat Pengiriman',
            'Metode Pembayaran',
            'Konfirmasi Pesanan',
            'Pembayaran Sukses'
        ];
        return titles[this.currentStep] || '';
    }

    /**
     * Get payment method label
     */
    getPaymentMethodLabel(): string {
        const method = this.paymentMethods.find(m => m.value === this.paymentMethod);
        return method ? method.label : '';
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
