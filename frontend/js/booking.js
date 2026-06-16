// Booking Module - API Integration
const API = '/api';

// Simple toast notification system
function showToast(message, type = 'success', duration = 4000) {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = `
    <div class="toast-content">
      <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${type === 'success' ? '<path d="M20 6 9 17l-5-5"/>' : type === 'error' ? '<circle cx="12" cy="12" r="10"/><path d="M15 9 9 15M9 9l6 6"/>' : '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>'}
      </svg>
      <span>${message}</span>
    </div>
    <button class="toast-close" aria-label="Dismiss">&times;</button>
  `;
  
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => removeToast(toast));
  
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  
  setTimeout(() => removeToast(toast), duration);
  
  return toast;
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

function removeToast(toast) {
  toast.classList.remove('show');
  toast.addEventListener('transitionend', () => toast.remove(), { once: true });
}

// Confirmation modal
function showConfirmationModal(bookingData) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'modal-title');
  
  const serviceName = bookingData.serviceId ? 
    ({basic: 'Basic Wash', interior: 'Interior Revival', ceramic: 'Ceramic Pro Package', full: 'Full Detail'}[bookingData.serviceId] || 'General') 
    : 'General';
  
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <svg class="modal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
        <h3 id="modal-title">Booking Confirmed</h3>
      </div>
      <div class="modal-body">
        <p class="modal-message">We'll contact you via WhatsApp within 2 hours to confirm.</p>
        <dl class="modal-details">
          <div><dt>Date</dt><dd>${bookingData.date}</dd></div>
          <div><dt>Time</dt><dd>${bookingData.slot_time}</dd></div>
          <div><dt>Service</dt><dd>${serviceName}</dd></div>
          <div><dt>Name</dt><dd>${bookingData.name}</dd></div>
          <div><dt>Phone</dt><dd>${bookingData.phone}</dd></div>
          ${bookingData.email ? `<div><dt>Email</dt><dd>${bookingData.email}</dd></div>` : ''}
          ${bookingData.vehicleReg ? `<div><dt>Vehicle</dt><dd>${bookingData.vehicleReg}</dd></div>` : ''}
          ${bookingData.notes ? `<div><dt>Notes</dt><dd>${bookingData.notes}</dd></div>` : ''}
        </dl>
      </div>
      <div class="modal-footer">
        <button class="btn-primary modal-close">Got it</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('show'));
  
  const closeBtn = modal.querySelector('.modal-close');
  const closeModal = () => {
    modal.classList.remove('show');
    modal.addEventListener('transitionend', () => modal.remove(), { once: true });
  };
  
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  // Trap focus
  const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  });
  
  firstElement?.focus();
  
  return modal;
}

async function request(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...options.headers },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'Request failed');
  return data;
}

function formEncode(obj) {
  return Object.entries(obj).filter(([,v]) => v != null && v !== '').map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

export async function loadServices() {
  try {
    const data = await request('/services');
    return Array.isArray(data.services) ? data.services : [];
  } catch { return []; }
}

export async function loadSlots(date) {
  try {
    const data = await request(`/slots?date=${encodeURIComponent(date)}`);
    return Array.isArray(data.slots) ? data.slots : [];
  } catch { return []; }
}

export async function loadBookings(date) {
  try {
    const data = await request(`/bookings?date=${encodeURIComponent(date)}`);
    return Array.isArray(data.bookings) ? data.bookings : [];
  } catch { return []; }
}

export async function submitBooking(data) {
  return request('/book', { method: 'POST', body: formEncode(data) });
}

export async function deleteBooking(id) {
  return request('/bookings/delete', { method: 'POST', body: formEncode({ id }) });
}

export function initBookingForm(formSelector, options = {}) {
  const form = document.querySelector(formSelector);
  if (!form) return;

  const dateInput = form.querySelector('[name="date"]') || document.getElementById('bookingDate');
  const slotSelect = form.querySelector('[name="slot_time"]') || document.getElementById('userSlot');
  const serviceSelect = form.querySelector('[name="serviceId"]') || document.getElementById('serviceSelect');
  const bookBtn = form.querySelector('[type="submit"]') || document.getElementById('bookBtn');
  const bookingsTable = document.getElementById('bookingsTable');

  async function renderServices() {
    const services = await loadServices();
    if (serviceSelect) {
      serviceSelect.innerHTML = '<option value="">Select service</option>' + services.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    }
  }

  async function renderSlots() {
    const date = dateInput?.value || '';
    if (!date && slotSelect) {
      slotSelect.innerHTML = '<option value="">Select date first</option>';
      return;
    }
    const slots = await loadSlots(date);
    if (slotSelect) {
      const morning = slots.filter(s => parseInt(s.time.split(':')[0]) < 12);
      const afternoon = slots.filter(s => parseInt(s.time.split(':')[0]) >= 12);
      let html = '<option value="">Select time</option>';
      if (morning.length) {
        html += '<optgroup label="Morning">' + morning.map(s => `<option value="${s.time}">${s.label}</option>`).join('') + '</optgroup>';
      }
      if (afternoon.length) {
        html += '<optgroup label="Afternoon">' + afternoon.map(s => `<option value="${s.time}">${s.label}</option>`).join('') + '</optgroup>';
      }
      slotSelect.innerHTML = html;
    }
  }

  async function renderBookings() {
    const date = dateInput?.value || '';
    const rows = await loadBookings(date);
    if (!bookingsTable) return;

    if (!rows.length) {
      bookingsTable.innerHTML = '<div class="text-sm text-brand-muted/90 py-3">No appointments for this date.</div>';
      return;
    }

    bookingsTable.innerHTML = `
      <div class="table-wrap overflow-x-auto rounded-2xl border border-brand-border">
        <table class="min-w-full text-sm">
          <thead class="bg-brand-panelAlt/80">
            <tr>
              <th class="text-left text-xs font-semibold text-brand-muted uppercase tracking-wider px-4 py-3">Time</th>
              <th class="text-left text-xs font-semibold text-brand-muted uppercase tracking-wider px-4 py-3">Name</th>
              <th class="text-left text-xs font-semibold text-brand-muted uppercase tracking-wider px-4 py-3">Phone</th>
              <th class="text-left text-xs font-semibold text-brand-muted uppercase tracking-wider px-4 py-3">Service</th>
              <th class="text-left text-xs font-semibold text-brand-muted uppercase tracking-wider px-4 py-3">Vehicle</th>
              <th class="text-left text-xs font-semibold text-brand-muted uppercase tracking-wider px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-border">
            ${rows.map(r => `
              <tr class="hover:bg-brand-panelAlt/60 transition-colors" data-id="${r.id}">
                <td class="px-4 py-3"><span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-brand-accent to-brand-accentDim text-bg">${r.time}</span></td>
                <td class="px-4 py-3">${r.name}</td>
                <td class="px-4 py-3">${r.phone}</td>
                <td class="px-4 py-3">${r.serviceName || 'General'}</td>
                <td class="px-4 py-3">${r.vehicleReg || '—'}</td>
                <td class="px-4 py-3">
                  <button data-action="del" class="px-3 py-1.5 rounded-lg bg-gradient-to-b from-brand-accent to-brand-accentDim text-xs font-semibold text-bg hover:opacity-90 transition-opacity">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    bookingsTable.querySelectorAll('[data-action="del"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const row = btn.closest('tr');
        const id = row?.dataset.id;
        if (!id) return;
        try {
          await deleteBooking(id);
          showToast('Appointment deleted', 'success');
          await renderBookings();
        } catch {
          showToast('Failed to delete appointment', 'error');
        }
      });
    });
  }

  dateInput?.addEventListener('change', () => {
    renderSlots();
    renderBookings();
  });

  // Inline validation
  const validators = {
    name: (v) => v.trim().length >= 2 || 'Name must be at least 2 characters',
    phone: (v) => /^\+?[\d\s-]{10,}$/.test(v.trim()) || 'Enter a valid phone number',
    email: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Enter a valid email',
    vehicleReg: (v) => !v || /^[A-Z]{1,3}\s?\d{1,4}$/i.test(v.trim().toUpperCase()) || 'Enter valid registration (e.g., ABC 1234)',
    serviceId: (v) => v !== '' || 'Select a service',
    slot_time: (v) => v !== '' || 'Select a time slot',
    date: (v) => v !== '' || 'Select a date',
  };

  function validateField(input) {
    const name = input.name;
    const validator = validators[name];
    if (!validator) return true;
    
    const error = validator(input.value);
    const errorEl = input.parentNode.querySelector('.field-error');
    
    if (error !== true) {
      input.classList.add('input-error');
      input.setAttribute('aria-invalid', 'true');
      if (!errorEl) {
        const err = document.createElement('div');
        err.className = 'field-error';
        err.setAttribute('role', 'alert');
        input.parentNode.appendChild(err);
      }
      input.parentNode.querySelector('.field-error').textContent = error;
      return false;
    } else {
      input.classList.remove('input-error');
      input.removeAttribute('aria-invalid');
      if (errorEl) errorEl.remove();
      return true;
    }
  }

  function validateForm() {
    const inputs = form.querySelectorAll('input[required], select[required]');
    let valid = true;
    inputs.forEach(input => {
      if (!validateField(input)) valid = false;
    });
    return valid;
  }

  // Attach validation listeners
  form.querySelectorAll('input, select, textarea').forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      if (input.classList.contains('input-error')) validateField(input);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.date = dateInput?.value || '';
    data.slot_time = slotSelect?.value || '';

    if (!validateForm()) {
      showToast('Please fix the errors above', 'error');
      return;
    }

    bookBtn.disabled = true;
    bookBtn.textContent = 'Booking...';

    try {
      await submitBooking(data);
      showConfirmationModal(data);
      form.reset();
      await renderSlots();
      await renderBookings();
    } catch (err) {
      showToast('Booking failed: ' + err.message, 'error');
    } finally {
      bookBtn.disabled = false;
      bookBtn.textContent = 'Confirm booking';
    }
  });

  renderServices();
  renderSlots();
  const today = new Date().toISOString().split('T')[0];
  if (dateInput) dateInput.value = today;
  renderSlots();
  renderBookings();
}
