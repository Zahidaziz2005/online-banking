import { initCustomerLogin } from "./modules/auth.js";
import { initDashboard } from "./modules/dashboard.js";
import { initTransfer } from "./modules/transfer.js";
import { initAdminPanel } from "./modules/admin.js";

document.addEventListener("DOMContentLoaded", () => {

    if (document.querySelector("#login-form")) {
        initCustomerLogin();
    }

    if (document.querySelector("#dashboard-page")) {
        initDashboard();
    }

    if (document.querySelector("#transfer-form")) {
        initTransfer();
    }

    if (document.querySelector("#admin-panel")) {
        initAdminPanel();
    }

});