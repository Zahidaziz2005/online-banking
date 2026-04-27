/**
 * Existing Layout Logic - Optimized for your HTML IDs
 */
async function handleTransfer() {
    // آپ کے HTML میں موجود اصل IDs کا استعمال
    const recipientField = document.getElementById('account_number');
    const amountField = document.getElementById('amount'); // آپ کے HTML میں id="amount" ہے
    const purposeField = document.getElementById('purpose');

    const recipient = recipientField?.value.trim();
    const amount = amountField?.value.trim();
    const purpose = purposeField?.value.trim();

    // 1. بنیادی ویلیڈیشن
    if (!recipient || !amount) {
        showErrorToast("Incomplete Data", "Please provide recipient and amount.");
        return;
    }

    // 2. لوڈنگ اینیمیشن شروع کریں
    toggleLoading(true, "Processing Transaction...");

    try {
        // 3. بیک اینڈ کو کال (ابھی فائل نہیں ہے تو یہ Catch میں جائے گا)
        const response = await fetch('../backend/transfer.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipient, amount, purpose })
        });

        // اگر فائل نہ ملے تو یہاں ایرر آئے گا
        if (!response.ok) throw new Error("File not found");

        const data = await response.json();
        toggleLoading(false);

        if (data.success) {
            showSuccessModal(data.recipient_name || recipient, data.amount_sent || amount);
        } else {
            showErrorToast("Failed", data.message || "Transaction declined.");
        }
    } catch (error) {
        toggleLoading(false);
        // یہاں "Error" ٹوسٹ نظر آنا چاہیے، جو ثابت کرے گا کہ فنکشن چل رہا ہے
        showErrorToast("Connection Error", "Server response failed. (Backend not ready)");
    }
}

/**
 * Event Listener - No Design Changes
 */
document.addEventListener('DOMContentLoaded', () => {
    const transferForm = document.querySelector('form');
    if (transferForm) {
        transferForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            handleTransfer(); 
        });
    }
    
});