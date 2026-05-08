/**
 * Beneficiaries.js - Dynamic Management for Apex Bank
 */

import api from '../core/api.js';

const userData = JSON.parse(localStorage.getItem('user_data'));
// سنگل اینڈ پوائنٹ کا استعمال کریں
const API_URL = '../backend/user/get_beneficiaries.php';

document.addEventListener('DOMContentLoaded', async () => {
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    await loadBeneficiaries();
    setupFormHandler();
});

/**
 * ڈیٹا لوڈ کرنے کا فنکشن
 */
async function loadBeneficiaries() {
    const grid = document.getElementById('beneficiaries-grid') || document.getElementById('beneficiaries-container');
    const countLabel = document.getElementById('recipient-count');

    if (!grid) return;

    try {
        // GET ریکوئسٹ کے ذریعے لسٹ حاصل کریں
        const response = await api.get(`${API_URL}?user_id=${userData.user_id}`);
        const addNewCard = renderAddNewCard();

        if (response.success && response.data.length > 0) {
            const cardsHTML = response.data.map(b => renderBeneficiaryCard(b)).join('');
            grid.innerHTML = cardsHTML + addNewCard;

            if (countLabel) {
                countLabel.textContent = `Displaying ${response.data.length} recipients`;
            }
        } else {
            grid.innerHTML = addNewCard;
            if (countLabel) countLabel.textContent = `Displaying 0 recipients`;
        }
    } catch (error) {
        console.error("Load Error:", error);
        grid.innerHTML = renderAddNewCard();
    }
}

/**
 * فارم سبمٹ ہینڈلر
 */
function setupFormHandler() {
    const form = document.getElementById('addBeneficiaryForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {
            user_id: userData.user_id,
            nickname: formData.get('nickname'),
            bank_name: formData.get('bank_name'),
            account_number: formData.get('account_number')
        };

        try {
            // POST ریکوئسٹ کے ذریعے نیا ڈیٹا بھیجیں
            const response = await api.post(API_URL, data);

            if (response.success) {
                closeAddModal();
                await loadBeneficiaries(); // لسٹ ریفریش کریں
                alert('Beneficiary added successfully!');
            } else {
                alert('Error: ' + response.message);
            }
        } catch (error) {
            console.error('Submission error:', error);
        }
    });
}

/**
 * UI Components
 */
function renderBeneficiaryCard(b) {
    const date = new Date(b.created_at).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    });

    const isCorporate = b.bank_name.toLowerCase().includes('apex');
    const icon = isCorporate ? 'corporate_fare' : 'person';
    const iconBg = isCorporate ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-container text-on-primary';

    return `
    <div class="bg-white border border-outline-variant rounded-xl p-md shadow-sm hover:shadow-md transition-shadow group">
        <div class="flex justify-between items-start mb-md">
            <div class="w-12 h-12 rounded-full ${iconBg} flex items-center justify-center">
                <span class="material-symbols-outlined">${icon}</span>
            </div>
            <div class="flex gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="p-xs hover:bg-surface-container-low rounded-lg transition-colors text-outline" onclick="editBeneficiary(${b.beneficiary_id})">
                    <span class="material-symbols-outlined text-[20px]">edit</span>
                </button>
                <button class="p-xs hover:bg-error-container hover:text-error rounded-lg transition-colors text-outline" onclick="deleteBeneficiary(${b.beneficiary_id})">
                    <span class="material-symbols-outlined text-[20px]">delete</span>
                </button>
            </div>
        </div>
        <div class="space-y-xs">
            <h4 class="font-h3 text-h3 text-primary truncate">${b.nickname}</h4>
            <div class="flex items-center gap-xs text-on-surface-variant">
                <span class="material-symbols-outlined text-[18px]">account_balance</span>
                <span class="font-body-sm text-body-sm">${b.bank_name}</span>
            </div>
            <div class="bg-surface-container-low p-sm rounded-lg mt-sm">
                <p class="font-label-caps text-label-caps text-on-surface-variant mb-xs text-[10px]">ACCOUNT NUMBER</p>
                <p class="font-body-md text-body-md font-mono text-primary tracking-widest">**** **** ${b.account_number.slice(-4)}</p>
            </div>
        </div>
        <div class="flex justify-between items-center mt-md pt-sm border-t border-outline-variant">
            <span class="text-[11px] text-on-surface-variant">Added: ${date}</span>
            <button onclick="initiateTransfer('${b.account_number}')" class="text-primary hover:underline font-button text-[13px] flex items-center gap-xs cursor-pointer">
                Send Money <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
        </div>
    </div>`;
}

function renderAddNewCard() {
    return `
    <div class="bg-white border border-outline-variant rounded-xl p-md shadow-sm hover:shadow-md transition-shadow group border-dashed flex flex-col items-center justify-center py-xl text-center cursor-pointer hover:bg-surface-container-low" onclick="openAddModal()">
        <div class="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-outline mb-sm group-hover:scale-110 transition-transform">
            <span class="material-symbols-outlined text-[32px]">add</span>
        </div>
        <h4 class="font-h3 text-h3 text-on-surface-variant">New Beneficiary</h4>
        <p class="font-body-sm text-body-sm text-outline mt-xs">Add account for quick payments</p>
    </div>`;
}

/**
 * Global Window Functions
 */
window.openAddModal = () => {
    document.getElementById('addBeneficiaryModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
};

window.closeAddModal = () => {
    document.getElementById('addBeneficiaryModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    document.getElementById('addBeneficiaryForm').reset();
};

window.initiateTransfer = (acc) => { window.location.href = `transfer.html?to=${acc}`; };
window.deleteBeneficiary = (id) => { if(confirm('Delete this recipient?')) console.log('Delete ID:', id); };