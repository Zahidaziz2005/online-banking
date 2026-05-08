/**
 * Auth.js - Apex Banking Authentication Module
 * Handles Registration, Login, and Session Management
 */
import api from '../core/api.js';

document.addEventListener('DOMContentLoaded', () => {
    // فارمز کو ان کی ID سے تلاش کرنا
    const registrationForm = document.getElementById('registration-form');
    const loginForm = document.getElementById('loginForm');

    // --- 1. رجسٹریشن کا لاجک ---
    if (registrationForm) {
        registrationForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // یہ لائن صفحہ ری فریش ہونے سے روکتی ہے
            
            console.log("Registration process initiated...");

            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm_password').value;

            // پاس ورڈ میچنگ چیک
            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }

            // فارم کا ڈیٹا اکٹھا کرنا
            const formData = new FormData(registrationForm);
            const data = Object.fromEntries(formData.entries());

            try {
                // بیک اینڈ کا مکمل پاتھ (یقینی بنائیں کہ یہ پاتھ آپ کے فولڈر سٹرکچر کے مطابق درست ہے)
                const response = await api.post('../backend/auth/register_user.php', data);
                
                if (response.success) {
                    alert('Account created successfully! Please login.');
                    window.location.href = 'login.html';
                } else {
                    alert('Registration failed: ' + response.message);
                }
            } catch (error) {
                console.error('Registration Error:', error);
                alert('An error occurred during registration.');
            }
        });
    }

    // --- 2. لاگ ان کا لاجک ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await api.post('../backend/auth/login_user.php', data);

                if (response.success && response.token) {
                    // سیشن محفوظ کرنا
                    localStorage.setItem('auth_token', response.token);
                    localStorage.setItem('user_data', JSON.stringify(response.user));
                    
                    // ڈیش بورڈ کی طرف روانگی
                    window.location.href = '../frontend/dashboard.html';
                } else {
                    alert('Login failed: ' + response.message);
                }
            } catch (error) {
                console.error('Login Error:', error);
                alert('Invalid credentials or server error.');
            }
        });
    }
});

/**
 * لاگ آؤٹ فنکشن
 */
export const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.location.href = '../login.html';
};