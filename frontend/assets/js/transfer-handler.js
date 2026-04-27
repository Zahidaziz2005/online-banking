// backend/js/transfer-handler.js

const loadTransferData = async () => {
  try {
    const response = await fetch(
      "/online-banking/backend/get_transfer_info.php",
    );
    const result = await response.json();

    if (result.success) {
      const user = result.data;

      // UI Elements update
      const sidebarElem = document.getElementById("user-name-side");
      const mainElem = document.getElementById("user-name-main");

      // دونوں جگہ James Smith لکھ دیں

      const accountElem = document.getElementById("user-account");
      const balanceElem = document.getElementById("user-balance");

      if (sidebarElem) sidebarElem.innerText = user.full_name;
      if (mainElem) mainElem.innerText = user.full_name;

      if (accountElem) {
        const lastFour = user.account_number.slice(-4);
        accountElem.innerText = `**** **** **** ${lastFour}`;
      }

      if (balanceElem) {
        balanceElem.innerText = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(user.balance);
      }
    } else {
      window.location.href = "login.html";
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

// Event listener
document.addEventListener("DOMContentLoaded", loadTransferData);
