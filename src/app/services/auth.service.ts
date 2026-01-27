import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';

export interface User {
    id?: number;
    nama: string;
    email: string;
    telepon: string;
    alamat: string;
    role: 'pembeli' | 'penjual';
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly STORAGE_KEY = 'tokobuah_users';
    private readonly CURRENT_USER_KEY = 'tokobuah_current_user';
    private readonly apiUrl = 'http://localhost/tokobuah_api';

    private currentUserSubject = new BehaviorSubject<User | null>(this.getCurrentUser());
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient) { }

    /**
     * Login via API with fallback to mock
     */
    login(email: string, password: string): Observable<{ success: boolean; message: string; user?: User }> {
        // Basic validation
        if (!email || !password) {
            return of({ success: false, message: 'Email dan password harus diisi' });
        }

        if (password.length < 6) {
            return of({ success: false, message: 'Password minimal 6 karakter' });
        }

        // Try API login first
        return this.http.post<any>(`${this.apiUrl}/auth.php?action=login`, {
            email: email,
            password: password
        }).pipe(
            map(response => {
                // API returns response.data.user
                if (response.success && response.data && response.data.user) {
                    const apiUser = response.data.user;
                    const user: User = {
                        id: apiUser.id,
                        nama: apiUser.name || apiUser.nama, // API uses 'name'
                        email: apiUser.email,
                        telepon: apiUser.phone || apiUser.telepon, // API uses 'phone'
                        alamat: apiUser.address || apiUser.alamat || '', // API uses 'address'
                        role: apiUser.role === 'seller' ? 'penjual' : 'pembeli'
                    };

                    // Save to localStorage and BehaviorSubject
                    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
                    this.currentUserSubject.next(user);

                    return { success: true, message: 'Login berhasil!', user };
                }
                return { success: false, message: response.message || 'Login gagal' };
            }),
            catchError(error => {
                console.error('Login error:', error);

                // Return a clear error format that login page expects
                const errorMessage = error.error?.message || error.message || 'Terjadi kesalahan saat login';
                return of({ success: false, message: errorMessage });
            })
        );
    }

    /**
     * Register new user - saves to localStorage
     */
    /**
     * Register new user via API
     */
    register(userData: Omit<User, 'role'> & { password: string }): Observable<{ success: boolean; message: string }> {
        return this.http.post<any>(`${this.apiUrl}/auth.php?action=register`, {
            name: userData.nama,
            email: userData.email,
            password: userData.password,
            phone: userData.telepon,
            address: userData.alamat,
            role: 'buyer' // Default role
        }).pipe(
            map(response => {
                if (response.success) {
                    return { success: true, message: 'Registrasi berhasil! Silakan login.' };
                }
                return { success: false, message: response.message || 'Registrasi gagal' };
            }),
            catchError(error => {
                console.error('Register error:', error);
                const errorMessage = error.error?.message || error.message || 'Terjadi kesalahan saat registrasi';
                return of({ success: false, message: errorMessage });
            })
        );
    }

    /**
     * Update current user data in session and storage
     */
    updateCurrentUser(userData: Partial<User>): void {
        const currentUser = this.currentUserSubject.value;
        if (currentUser) {
            const updatedUser = { ...currentUser, ...userData };

            this.currentUserSubject.next(updatedUser);
            localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(updatedUser));

            const users = this.getUsers();
            const index = users.findIndex((u: any) => u.email === updatedUser.email);
            if (index !== -1) {
                users[index] = updatedUser;
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
            }
        }
    }

    /**
     * Logout current user
     */
    logout(): void {
        localStorage.removeItem(this.CURRENT_USER_KEY);
        this.currentUserSubject.next(null);
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return this.getCurrentUser() !== null;
    }

    /**
     * Get current user from localStorage
     */
    private getCurrentUser(): User | null {
        const userStr = localStorage.getItem(this.CURRENT_USER_KEY);
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch {
                return null;
            }
        }
        return null;
    }

    /**
     * Get all users from localStorage
     */
    private getUsers(): User[] {
        const usersStr = localStorage.getItem(this.STORAGE_KEY);
        if (usersStr) {
            try {
                return JSON.parse(usersStr);
            } catch {
                return [];
            }
        }
        return [];
    }

    /**
     * Get current user value (synchronous)
     */
    getCurrentUserValue(): User | null {
        return this.currentUserSubject.value;
    }
}
