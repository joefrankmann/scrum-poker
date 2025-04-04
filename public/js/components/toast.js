/**
 * Toast Notifications Component
 * Handles the display of toast notifications
 */

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Notification type ('info', 'success', 'warning', 'error')
 * @param {number} duration - Duration in milliseconds
 */
function showToast(message, type = 'info', duration = 5000) {
  const toastContainer = document.getElementById('toastContainer');
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.classList.add('fade-in');
  
  const toastHeader = document.createElement('div');
  toastHeader.className = 'toast-header';
  
  const title = document.createElement('span');
  title.className = 'toast-title';
  title.textContent = type.charAt(0).toUpperCase() + type.slice(1);
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', () => {
    toast.classList.remove('fade-in');
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  });
  
  toastHeader.appendChild(title);
  toastHeader.appendChild(closeBtn);
  
  const toastBody = document.createElement('div');
  toastBody.className = 'toast-body';
  toastBody.textContent = message;
  
  toast.appendChild(toastHeader);
  toast.appendChild(toastBody);
  
  toastContainer.appendChild(toast);
  
  // Auto remove after duration
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.remove('fade-in');
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }
  }, duration);
}