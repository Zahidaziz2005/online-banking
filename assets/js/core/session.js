// session.js
export const checkAuth = () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        // اگر ٹوکن نہیں ہے تو لاگ ان پر بھیج دیں
        window.location.href = '/frontend/index.html';
    }
};

export const logout = () => {
    localStorage.clear();
    window.location.href = '/frontend/index.html';
};