import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Category {
    id: number;
    name: string;
    icon: string;
    color: string;
}

export interface Product {
    id: number;
    seller_id: number;
    category_id: number;
    name: string;
    description: string;
    price: number;
    original_price?: number;
    originalPrice?: number; // Alias for template compatibility
    discount: number;
    stock: number;
    sold: number;
    rating: number;
    image: string;
    status: string;
    category_name?: string;
    category?: string; // Alias for template compatibility
    category_icon?: string;
    reviews?: number; // Mock field for display
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

export interface CartItem {
    id: number;
    user_id: number;
    product_id: number;
    quantity: number;
    name: string;
    price: number;
    image: string;
    stock: number;
    subtotal: number;
    description?: string;
    originalPrice?: number;
    discount?: number;
    selected?: boolean;
}

export interface CartSummary {
    items: CartItem[];
    summary: {
        total_items: number;
        total_price: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private apiUrl = 'http://localhost/tokobuah_api';

    constructor(private http: HttpClient) { }

    /**
     * Get all categories
     */
    getCategories(): Observable<Category[]> {
        return this.http.get<ApiResponse<Category[]>>(`${this.apiUrl}/categories.php`)
            .pipe(
                map(response => response.data || []),
                catchError(this.handleError)
            );
    }

    /**
     * Get products with optional filters
     */
    getProducts(filters?: {
        category?: string;
        search?: string;
        status?: string;
        seller_id?: number;
    }): Observable<Product[]> {
        let params = new HttpParams();

        if (filters) {
            if (filters.category) params = params.set('category', filters.category);
            if (filters.search) params = params.set('search', filters.search);
            if (filters.status) params = params.set('status', filters.status);
            if (filters.seller_id) params = params.set('seller_id', filters.seller_id.toString());
        }

        return this.http.get<ApiResponse<Product[]>>(`${this.apiUrl}/products.php`, { params })
            .pipe(
                map(response => response.data || []),
                catchError(this.handleError)
            );
    }

    /**
     * Get single product by ID
     */
    getProductById(id: number): Observable<Product> {
        return this.http.get<ApiResponse<Product>>(`${this.apiUrl}/products.php?id=${id}`)
            .pipe(
                map(response => {
                    if (response.success && response.data) {
                        return response.data;
                    }
                    throw new Error('Product not found');
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Add new product
     */
    addProduct(productData: any): Observable<any> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/products.php`, productData)
            .pipe(
                map(response => {
                    if (response.success) {
                        return response.data;
                    }
                    throw new Error(response.message || 'Failed to add product');
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Update existing product
     */
    updateProduct(id: number, productData: any): Observable<any> {
        return this.http.put<ApiResponse<any>>(`${this.apiUrl}/products.php?id=${id}`, productData)
            .pipe(
                map(response => {
                    if (response.success) {
                        return response.data;
                    }
                    throw new Error(response.message || 'Failed to update product');
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Delete product
     */
    deleteProduct(id: number): Observable<any> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/products.php?id=${id}`)
            .pipe(
                map(response => {
                    if (response.success) {
                        return true;
                    }
                    throw new Error(response.message || 'Failed to delete product');
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Toggle product status
     */
    toggleProductStatus(id: number): Observable<any> {
        return this.http.put<ApiResponse<any>>(`${this.apiUrl}/products.php?action=toggle-status&id=${id}`, {})
            .pipe(
                map(response => {
                    if (response.success) {
                        return response.data;
                    }
                    throw new Error(response.message || 'Failed to toggle status');
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Get vouchers
     */
    getVouchers(params: any = {}): Observable<any> {
        let httpParams = new HttpParams();
        for (const key in params) {
            if (params.hasOwnProperty(key)) {
                httpParams = httpParams.set(key, params[key]);
            }
        }

        return this.http.get<ApiResponse<any>>(`${this.apiUrl}/vouchers.php`, { params: httpParams })
            .pipe(
                map(response => response.data || []),
                catchError(this.handleError)
            );
    }

    /**
     * Add new voucher
     */
    addVoucher(voucherData: any): Observable<any> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/vouchers.php`, voucherData)
            .pipe(
                map(response => {
                    if (response.success) {
                        return response.data;
                    }
                    throw new Error(response.message || 'Failed to add voucher');
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Update existing voucher
     */
    updateVoucher(id: number, voucherData: any): Observable<any> {
        return this.http.put<ApiResponse<any>>(`${this.apiUrl}/vouchers.php?id=${id}`, voucherData)
            .pipe(
                map(response => {
                    if (response.success) {
                        return response.data;
                    }
                    throw new Error(response.message || 'Failed to update voucher');
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Delete voucher
     */
    deleteVoucher(id: number): Observable<any> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/vouchers.php?id=${id}`)
            .pipe(
                map(response => {
                    if (response.success) {
                        return true;
                    }
                    throw new Error(response.message || 'Failed to delete voucher');
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Add item to cart
     */
    addToCart(userId: number, productId: number, quantity: number = 1): Observable<any> {
        const body = {
            user_id: userId,
            product_id: productId,
            quantity: quantity
        };

        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/cart.php`, body)
            .pipe(
                map(response => {
                    if (response.success) {
                        return response.data;
                    }
                    throw new Error(response.message || 'Failed to add to cart');
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Get user's cart
     */
    getCart(userId: number): Observable<CartSummary> {
        return this.http.get<ApiResponse<CartSummary>>(`${this.apiUrl}/cart.php?user_id=${userId}`)
            .pipe(
                map(response => {
                    if (response.success && response.data) {
                        return response.data;
                    }
                    return { items: [], summary: { total_items: 0, total_price: 0 } };
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Update cart item quantity
     */
    updateCartItem(cartId: number, quantity: number): Observable<any> {
        const body = { quantity };
        return this.http.put<ApiResponse<any>>(`${this.apiUrl}/cart.php?id=${cartId}`, body)
            .pipe(
                map(response => {
                    if (response.success) {
                        return response.data;
                    }
                    throw new Error(response.message || 'Failed to update cart');
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Remove item from cart
     */
    removeFromCart(cartId: number): Observable<any> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/cart.php?id=${cartId}`)
            .pipe(
                map(response => {
                    if (response.success) {
                        return response.data;
                    }
                    throw new Error(response.message || 'Failed to remove from cart');
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Clear entire cart
     */
    clearCart(userId: number): Observable<any> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/cart.php?action=clear&user_id=${userId}`)
            .pipe(
                map(response => {
                    if (response.success) {
                        return response.data;
                    }
                    throw new Error(response.message || 'Failed to clear cart');
                }),
                catchError(this.handleError)
            );
    }

    /**
   * Create new order
   */
    createOrder(orderData: {
        user_id: number;
        seller_id: number;
        customer_name: string;
        customer_phone: string;
        shipping_address: string;
        notes?: string;
        voucher_code?: string;
        items: Array<{ product_id: number; quantity: number }>;
    }): Observable<any> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/orders.php`, orderData)
            .pipe(
                map(response => {
                    if (response.success) {
                        return response.data;
                    }
                    throw new Error(response.message || 'Failed to create order');
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Get seller dashboard stats
     */
    getSellerDashboard(sellerId: number): Observable<any> {
        return this.http.get<ApiResponse<any>>(`${this.apiUrl}/dashboard.php?seller_id=${sellerId}`)
            .pipe(
                map(response => response.data || {}),
                catchError(this.handleError)
            );
    }

    /**
     * Update user profile
     */
    updateProfile(userData: any): Observable<any> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/auth.php?action=update-profile`, userData)
            .pipe(
                map(response => {
                    if (response.success) {
                        return response.data;
                    }
                    throw new Error(response.message || 'Update failed');
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Change password
     */
    changePassword(data: any): Observable<any> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/auth.php?action=change-password`, data)
            .pipe(
                map(response => {
                    if (response.success) {
                        return response.data;
                    }
                    throw new Error(response.message || 'Change password failed');
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Get orders (supports userId (number) for backward compatibility or params object)
     */
    getOrders(userIdOrParams: any, status?: string): Observable<any[]> {
        let httpParams = new HttpParams();

        if (typeof userIdOrParams === 'number') {
            httpParams = httpParams.set('user_id', userIdOrParams.toString());
            if (status) {
                httpParams = httpParams.set('status', status);
            }
        } else {
            const params = userIdOrParams || {};
            for (const key in params) {
                if (params.hasOwnProperty(key)) {
                    httpParams = httpParams.set(key, params[key]);
                }
            }
        }

        return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/orders.php`, { params: httpParams })
            .pipe(
                map(response => response.data || []),
                catchError(this.handleError)
            );
    }

    /**
     * Get single order details
     */
    getOrderById(orderId: number): Observable<any> {
        return this.http.get<ApiResponse<any>>(`${this.apiUrl}/orders.php?id=${orderId}`)
            .pipe(
                map(response => {
                    if (response.success && response.data) {
                        return response.data;
                    }
                    throw new Error('Order not found');
                }),
                catchError(this.handleError)
            );
    }

    /**
   * Get active vouchers
   */


    /**
     * Update order status
     */
    updateOrderStatus(orderId: number, status: string, resi?: string): Observable<any> {
        const body: any = { status };
        // The API might expect 'resi' or we might need to send it if status is 'shipped' (dikirim)
        // Based on orders.php (which currently only handles status in PUT), let's check if we need to send resi separately
        // Actually orders.php PUT only updates status in the current provided code 'action=update-status'
        // But let's assume we might expand it or it's handled. 
        // Wait, I saw orders.php code.
        // It accepts PUT with action=update-status and body { status: ... }
        // It doesn't seem to handle 'resi' in the update-status block yet.
        // But for now let's implement the service method to send what we have.
        // If the backend needs adjustment for resi, we might need to fix backend too.
        // Let's stick to what's verified: status update.

        return this.http.put<ApiResponse<any>>(`${this.apiUrl}/orders.php?action=update-status&id=${orderId}`, body)
            .pipe(
                map(response => {
                    if (response.success) {
                        return response.data;
                    }
                    throw new Error(response.message || 'Failed to update order status');
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Get single order details
     */
    getOrder(orderId: number): Observable<any> {
        return this.http.get<ApiResponse<any>>(`${this.apiUrl}/orders.php?id=${orderId}`)
            .pipe(
                map(response => {
                    if (response.success && response.data) {
                        return response.data;
                    }
                    throw new Error('Order not found');
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Validate voucher code
     */
    validateVoucher(code: string): Observable<any> {
        return this.http.get<ApiResponse<any>>(`${this.apiUrl}/vouchers.php?code=${code}`)
            .pipe(
                map(response => {
                    if (response.success && response.data) {
                        return response.data;
                    }
                    throw new Error(response.message || 'Voucher tidak valid');
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Submit a product review
     */
    submitReview(reviewData: any): Observable<any> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/reviews.php`, reviewData)
            .pipe(
                map(response => {
                    if (response.success) {
                        return response.data;
                    }
                    throw new Error(response.message || 'Failed to submit review');
                }),
                catchError(this.handleError)
            );
    }

    /**
     * Handle HTTP errors
     */
    private handleError(error: any): Observable<never> {
        let errorMessage = 'An error occurred';

        if (error.error instanceof ErrorEvent) {
            // Client-side error
            errorMessage = `Error: ${error.error.message}`;
        } else {
            // Server-side error
            errorMessage = error.error?.message || error.message || `Error Code: ${error.status}`;
        }

        console.error('API Error:', errorMessage);
        return throwError(() => new Error(errorMessage));
    }
}
