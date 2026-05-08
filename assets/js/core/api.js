// assets/js/core/api.js

const api = {
    // GET Method
    async get(url) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                    // اگر آپ ٹوکن استعمال کر رہے ہیں تو یہاں شامل کریں
                    // 'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Fetch GET Error:', error);
            return { success: false, message: "سرور سے رابطہ نہیں ہو سکا" };
        }
    },

    // POST Method
    async post(url, data) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Fetch POST Error:', error);
            return { success: false, message: "سرور سے رابطہ نہیں ہو سکا" };
        }
    }
};

export default api;