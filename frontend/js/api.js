/**
 * InfoClub API Wrapper
 */
const API_BASE_URL = 'http://127.0.0.1:8000';

class InfoClubAPI {
    static async request(endpoint, options = {}) {
        const token = localStorage.getItem('infoclub_token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('infoclub_token');
            localStorage.removeItem('infoclub_user');
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Une erreur est survenue');
        }

        if (response.status === 204) return null;
        return response.json();
    }

    static async login(email, password) {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Identifiants incorrects');
        }

        const data = await response.json();
        localStorage.setItem('infoclub_token', data.access_token);

        // No longer storing full user in localStorage for security/freshness
        return { token: data.access_token };
    }

    static async register(userData) {
        return this.request('/members/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    static async getCurrentUser() {
        return this.request('/auth/me');
    }

    static logout() {
        localStorage.removeItem('infoclub_token');
        localStorage.removeItem('infoclub_user'); // Clean up old data if any
        window.location.href = 'index.html';
    }

    static isAuthenticated() {
        return !!localStorage.getItem('infoclub_token');
    }

    // Now async and fetches from API
    static async getUser() {
        if (!this.isAuthenticated()) return null;
        try {
            return await this.getCurrentUser();
        } catch (err) {
            return null;
        }
    }

    // Now async and fetches from API
    static async isAdmin() {
        const user = await this.getUser();
        return user && (user.role === 'head' || user.role === 'mod');
    }
}

window.api = InfoClubAPI;
