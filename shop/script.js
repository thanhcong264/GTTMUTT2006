// ============================================================
// script.js – Shared logic for ShopVN
// ============================================================

// --- Cart state ---
let cart = JSON.parse(localStorage.getItem('cart') || '[]');

// --- Initialize on DOM ready ---
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
});

// ============================================================
// CART
// ============================================================
function addToCart(name, price) {
  const existing = cart.find(item => item.name === name);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name, price, qty: 1 });
  }
  saveCart();
  updateCartBadge();
  showToast(`Đã thêm "<strong>${name}</strong>" vào giỏ hàng!`);
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartBadge() {
  const total = cart.reduce((acc, item) => acc + item.qty, 0);
  const badges = document.querySelectorAll('#cart-count');
  badges.forEach(badge => {
    badge.textContent = total;
    badge.style.display = total > 0 ? 'flex' : 'none';
  });
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================
function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fa-solid fa-circle-check toast-icon"></i><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'all .3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(120%)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ============================================================
// HEADER SCROLL EFFECT
// ============================================================
const header = document.querySelector('.header');
if (header) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.style.boxShadow = '0 4px 20px rgba(0,0,0,.12)';
    } else {
      header.style.boxShadow = '0 1px 3px rgba(0,0,0,.08)';
    }
  });
}

// ============================================================
// SMOOTH SCROLL for anchor links
// ============================================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
