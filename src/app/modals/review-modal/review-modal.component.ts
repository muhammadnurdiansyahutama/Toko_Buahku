import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-review-modal',
  templateUrl: './review-modal.component.html',
  styleUrls: ['./review-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ReviewModalComponent implements OnInit {
  @Input() order: any;
  userId: number = 0;

  constructor(
    private modalController: ModalController,
    private apiService: ApiService,
    private authService: AuthService,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    const user = this.authService.getCurrentUserValue();
    if (user && user.id) {
      this.userId = user.id;
    }

    // Initialize state for each item if not already set
    if (this.order && this.order.items) {
      this.order.items.forEach((item: any) => {
        if (item.rating === undefined) item.rating = 0;
        if (item.comment === undefined) item.comment = '';
        if (item.submitted === undefined) item.submitted = false;
        if (item.isSubmitting === undefined) item.isSubmitting = false;
      });
    }
  }

  dismiss() {
    // Check if at least one review was submitted
    const hasSubmitted = this.order.items.some((item: any) => item.submitted);
    this.modalController.dismiss({
      hasSubmitted: hasSubmitted
    });
  }

  setRating(index: number, rating: number) {
    if (!this.order.items[index].submitted) {
      this.order.items[index].rating = rating;
    }
  }

  submitReview(item: any) {
    if (item.rating === 0) {
      this.showToast('Silakan pilih bintang rating', 'warning');
      return;
    }

    if (this.userId <= 0) {
      this.showToast('Silakan login kembali', 'danger');
      return;
    }

    item.isSubmitting = true;

    const reviewData = {
      product_id: item.product_id,
      user_id: this.userId,
      order_id: this.order.id,
      rating: item.rating,
      comment: item.comment
    };

    this.apiService.submitReview(reviewData).subscribe({
      next: (response) => {
        item.submitted = true;
        item.isSubmitting = false;
        this.showToast('Ulasan berhasil dikirim!', 'success');
      },
      error: (error) => {
        console.error('Submit review error:', error);

        // Handle "already reviewed" specifically if possible, 
        // but API returns 400 with message usually
        const message = error.message && error.message.includes('already reviewed')
          ? 'Anda sudah mengulas produk ini sebelumnya'
          : 'Gagal mengirim ulasan';

        this.showToast(message, 'danger');
        item.isSubmitting = false;

        // If already reviewed, mark as submitted so user knows
        if (message.includes('sudah mengulas')) {
          item.submitted = true;
        }
      }
    });
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }
}
