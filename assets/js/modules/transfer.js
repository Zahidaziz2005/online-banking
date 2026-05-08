import api from '../core/api.js';

document.addEventListener('DOMContentLoaded', () => {
    const transferBtn = document.getElementById('confirmTransferBtn');

    if (transferBtn) {
        transferBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            // 1. فارم سے ڈیٹا حاصل کریں (Updated IDs)
            const userData = JSON.parse(localStorage.getItem('user_data'));
            const receiver_acc = document.getElementById('receiver_account_number').value.trim();
            const amount = document.getElementById('transfer_amount').value;
            const description = document.getElementById('transfer_description').value.trim();
            const currency = document.getElementById('currency_select').value;

            // 2. بنیادی ویلیڈیشن
            if (!receiver_acc || !amount || amount <= 0) {
                alert("براہ کرم اکاؤنٹ نمبر اور درست رقم درج کریں۔");
                return;
            }

            // 3. UI اپ ڈیٹ (Loading State)
            const originalText = transferBtn.textContent;
            transferBtn.disabled = true;
            transferBtn.textContent = 'Processing...';

            try {
                // 4. API کال (Schema کے مطابق ڈیٹا بھیجنا)
                const response = await api.post('../backend/banking/transfer.php', {
                    sender_id: userData.user_id,
                    receiver_account: receiver_acc,
                    amount: parseFloat(amount),
                    description: description || 'Fund Transfer',
                    currency: currency
                });

                if (response.success) {
                    alert("کامیاب! " + response.message);
                    // کامیاب ٹرانسفر کے بعد ڈیش بورڈ پر ری ڈائریکٹ
                    window.location.href = './dashboard.html';
                } else {
                    alert("نہیں ہو سکا: " + response.message);
                }
            } catch (error) {
                console.error("Transfer Error:", error);
                alert("سرور سے رابطہ کرنے میں دشواری پیش آئی ہے۔ دوبارہ کوشش کریں۔");
            } finally {
                // 5. بٹن کو واپس اصلی حالت میں لانا
                transferBtn.disabled = false;
                transferBtn.textContent = originalText;
            }
        });
    } else {
        console.error("Confirm Transfer بٹن نہیں ملا۔ براہ کرم HTML ID چیک کریں۔");
    }
});