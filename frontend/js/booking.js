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

// Announce to screen readers
function announce(message) {
  const liveRegion = document.getElementById('a11y-announcer') || createAnnouncer();
  liveRegion.textContent = message;
}

function createAnnouncer() {
  const div = document.createElement('div');
  div.id = 'a11y-announcer';
  div.setAttribute('role', 'status');
  div.setAttribute('aria-live', 'polite');
  div.setAttribute('aria-atomic', 'true');
  div.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;';
  document.body.appendChild(div);
  return div;
}

// Skeleton loading for slot grid
function renderSlotSkeletons(count = 8) {
  const grid = document.getElementById('slot-grid');
  if (!grid) return;
  grid.innerHTML = Array.from({ length: count }, () => `
    <div class="slot-skeleton h-12 rounded-xl animate-pulse" aria-hidden="true"></div>
  `).join('');
}

// Skeleton loading for services dropdown
function renderServiceSkeleton() {
  const select = document.getElementById('serviceSelect');
  if (!select) return;
  select.innerHTML = '<option value="" disabled>Loading services...</option>';
  select.disabled = true;
}

// Confirmation modal with enhanced UX
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
        <div class="modal-icon-wrapper">
          <svg class="modal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        </div>
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
        <div class="modal-actions">
          <button class="btn-primary modal-close w-full sm:w-auto">Add to Calendar</button>
          <button class="btn-secondary modal-close w-full sm:w-auto">Done</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('show'));
  
  const closeBtns = modal.querySelectorAll('.modal-close');
  const closeModal = () => {
    modal.classList.remove('show');
    modal.addEventListener('transitionend', () => modal.remove(), { once: true });
  };
  
  closeBtns.forEach(btn => btn.addEventListener('click', closeModal));
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
  
  // Generate ICS for calendar
  const calendarBtn = modal.querySelector('.btn-primary');
  if (calendarBtn) {
    calendarBtn.addEventListener('click', () => {
      const icsContent = generateICS(bookingData, serviceName);
      downloadICS(icsContent, `magshine-booking-${bookingData.date}.ics`);
      showToast('Calendar file downloaded', 'success');
    });
  }
  
  return modal;
}

function generateICS(bookingData, serviceName) {
  const startDate = bookingData.date.replace(/-/g, '');
  const [startHour, startMin] = bookingData.slot_time.split(':');
  const endHour = parseInt(startHour) + 1;
  const startTime = `${startDate}T${startHour}${startMin}00`;
  const endTime = `${startDate}T${endHour.toString().padStart(2, '0')}${startMin}00`;
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MagShine//Booking//EN
BEGIN:VEVENT
UID:${bookingData.slot_time}-${bookingData.name}-${Date.now()}@magshine
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startTime}
DTEND:${endTime}
SUMMARY:MagShine Appointment: ${serviceName}
DESCRIPTION:Appointment with MagShine for ${serviceName}.${bookingData.notes ? ` Notes: ${bookingData.notes}` : ''}
LOCATION:MagShine Studio, E-G-45, Jalan PJU 1/45, Aman Suria Damansara, 47301 Petaling Jaya, Selangor, Malaysia
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
}

function downloadICS(content, filename) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
  const slotInput = form.querySelector('[name="slot_time"]') || document.getElementById('userSlot');
  const slotGrid = document.getElementById('slot-grid');
  const serviceSelect = form.querySelector('[name="serviceId"]') || document.getElementById('serviceSelect');
  const bookBtn = form.querySelector('[type="submit"]') || document.getElementById('bookBtn');
  const btnText = bookBtn?.querySelector('.btn-text');
  const btnLoading = bookBtn?.querySelector('.btn-loading');
  const bookingsTable = document.getElementById('bookingsTable');

  let selectedSlot = null;

  async function renderServices() {
    renderServiceSkeleton();
    const services = await loadServices();
    if (serviceSelect) {
      serviceSelect.innerHTML = '<option value="">Select service</option>' + services.map(s => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}</option>`).join('');
      serviceSelect.disabled = false;
    }
  }

  async function renderSlots() {
    const date = dateInput?.value || '';
    if (!date && slotGrid) {
      slotGrid.innerHTML = '<p class="col-span-full text-center text-brand-textDim/60 py-4">Select a date to see available time slots</p>';
      slotInput.value = '';
      updateBookBtnState();
      return;
    }
    renderSlotSkeletons();
    const slots = await loadSlots(date);
    if (slotGrid) {
      if (!slots.length) {
        slotGrid.innerHTML = `
          <div class="col-span-full text-center py-8" role="status" aria-live="polite">
            <svg class="mx-auto mb-3 text-brand-muted/40 h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p class="text-brand-textDim">No slots available for this date</p>
            <p class="text-xs text-brand-textDim/60 mt-1 mb-4">Please select another date</p>
            <button type="button" class="btn-secondary px-6 py-2.5 rounded-xl text-sm font-medium" id="empty-slots-pick-date" aria-label="Pick another date">
              <svg class="inline w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Pick Another Date
            </button>
          </div>
        `;
        // Add pick date button handler - focuses the date input
        const pickDateBtn = document.getElementById('empty-slots-pick-date');
        if (pickDateBtn && dateInput) {
          pickDateBtn.addEventListener('click', () => dateInput.focus());
        }
        slotInput.value = '';
        selectedSlot = null;
        updateBookBtnState();
        return;
      }
      const morning = slots.filter(s => parseInt(s.time.split(':')[0]) < 12);
      const afternoon = slots.filter(s => parseInt(s.time.split(':')[0]) >= 12);
      let html = '';
      let slotIndex = 0;
      if (morning.length) {
        html += '<div class="slot-group-label" role="heading" aria-level="3" aria-label="Morning slots">Morning</div>';
        html += '<div class="slot-group" role="group" aria-label="Morning time slots">';
        html += morning.map((s, i) => `
          <button type="button" class="time-slot-btn" data-time="${escapeHtml(s.time)}" data-label="${escapeHtml(s.label)}" role="option" aria-selected="false" tabindex="0" aria-posinset="${i + 1}" aria-setsize="${morning.length}" style="animation-delay: ${slotIndex * 50}ms">
            <span class="slot-time">${escapeHtml(s.label)}</span>
          </button>
        `).join('');
        html += '</div>';
        slotIndex += morning.length;
      }
      if (afternoon.length) {
        html += '<div class="slot-group-label" role="heading" aria-level="3" aria-label="Afternoon slots">Afternoon</div>';
        html += '<div class="slot-group" role="group" aria-label="Afternoon time slots">';
        html += afternoon.map((s, i) => `
          <button type="button" class="time-slot-btn" data-time="${escapeHtml(s.time)}" data-label="${escapeHtml(s.label)}" role="option" aria-selected="false" tabindex="0" aria-posinset="${i + 1}" aria-setsize="${afternoon.length}" style="animation-delay: ${slotIndex * 50}ms">
            <span class="slot-time">${escapeHtml(s.label)}</span>
          </button>
        `).join('');
        html += '</div>';
      }
      slotGrid.innerHTML = html;
      attachSlotListeners();
    }
  }

  function attachSlotListeners() {
    const slotBtns = slotGrid?.querySelectorAll('.time-slot-btn');
    slotBtns?.forEach(btn => {
      btn.addEventListener('click', () => selectSlot(btn));
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectSlot(btn);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const allBtns = Array.from(slotBtns);
          const idx = allBtns.indexOf(btn);
          const nextIdx = e.key === 'ArrowRight' ? (idx + 1) % allBtns.length : (idx - 1 + allBtns.length) % allBtns.length;
          allBtns[nextIdx].focus();
        }
      });
    });
  }

  function selectSlot(btn) {
    if (btn.classList.contains('booked')) return;
    slotGrid?.querySelectorAll('.time-slot-btn').forEach(b => {
      b.classList.remove('selected');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('selected');
    btn.setAttribute('aria-selected', 'true');
    selectedSlot = btn.dataset.time;
    slotInput.value = selectedSlot;
    announce(`${btn.dataset.label} selected`);
    clearSlotError();
    updateBookBtnState();
  }

  async function renderBookings() {
    const date = dateInput?.value || '';
    const rows = await loadBookings(date);
    if (!bookingsTable) return;

    if (!rows.length) {
      bookingsTable.innerHTML = `
        <div class="empty-state py-12 text-center" role="status" aria-live="polite">
          <svg class="mx-auto mb-4 text-brand-muted/40 h-16 w-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <h4 class="empty-state-title font-semibold text-white mb-2">No appointments for this date</h4>
          <p class="empty-state-message text-brand-textDim text-sm mb-6">Appointments for ${date ? new Date(date).toLocaleDateString() : 'selected date'} will appear here.</p>
          <button type="button" class="btn-secondary px-6 py-2.5 rounded-xl text-sm font-medium" id="empty-state-refresh" aria-label="Refresh appointments">
            <svg class="inline w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M23 4v6h-6"/>
              <path d="M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
        </div>
      `;
      // Add refresh button handler
      const refreshBtn = document.getElementById('empty-state-refresh');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => renderBookings());
      }
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
                <td class="px-4 py-3">${escapeHtml(r.name)}</td>
                <td class="px-4 py-3">${escapeHtml(r.phone)}</td>
                <td class="px-4 py-3">${escapeHtml(r.serviceName || 'General')}</td>
                <td class="px-4 py-3">${escapeHtml(r.vehicleReg || '—')}</td>
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
    selectedSlot = null;
    slotInput.value = '';
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

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function validateField(input) {
    const name = input.name;
    const validator = validators[name];
    if (!validator) return true;

    const error = validator(input.value);
    const errorEl = document.getElementById(`${name}-error`) || input.parentNode.querySelector('.field-error');

    if (error !== true) {
      input.classList.add('input-error');
      input.setAttribute('aria-invalid', 'true');
      if (errorEl) {
        errorEl.textContent = error;
        errorEl.classList.add('visible');
      }
      return false;
    } else {
      input.classList.remove('input-error');
      input.removeAttribute('aria-invalid');
      if (errorEl) {
        errorEl.classList.remove('visible');
        errorEl.textContent = '';
      }
      return true;
    }
  }

  function validateForm() {
    const inputs = form.querySelectorAll('input[required], select[required]');
    let valid = true;
    inputs.forEach(input => {
      if (!validateField(input)) valid = false;
    });
    // Also check slot selection
    if (!selectedSlot) {
      showSlotError('Select a time slot');
      valid = false;
    } else {
      clearSlotError();
    }
    return valid;
  }

  function showSlotError(message) {
    const errorEl = document.getElementById('slot-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }
    slotGrid?.setAttribute('aria-invalid', 'true');
  }

  function clearSlotError() {
    const errorEl = document.getElementById('slot-error');
    if (errorEl) {
      errorEl.classList.remove('visible');
      errorEl.textContent = '';
    }
    slotGrid?.removeAttribute('aria-invalid');
  }

  function updateBookBtnState() {
    const requiredInputs = form.querySelectorAll('input[required], select[required]');
    let allFilled = true;
    requiredInputs.forEach(input => {
      if (!input.value.trim()) allFilled = false;
    });
    if (!selectedSlot) allFilled = false;
    
    if (bookBtn) {
      bookBtn.disabled = !allFilled;
    }
  }

  // Attach validation listeners
  form.querySelectorAll('input, select, textarea').forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      if (input.classList.contains('input-error')) validateField(input);
      updateBookBtnState();
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.date = dateInput?.value || '';
    data.slot_time = selectedSlot || slotInput?.value || '';

    if (!validateForm()) {
      showToast('Please fix the errors above', 'error');
      return;
    }

    // Show loading state
    bookBtn.disabled = true;
    if (btnText) btnText.classList.add('hidden');
    if (btnLoading) btnLoading.classList.remove('hidden');

    try {
      await submitBooking(data);
      showConfirmationModal(data);
      form.reset();
      selectedSlot = null;
      slotInput.value = '';
      slotGrid?.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
      await renderSlots();
      await renderBookings();
    } catch (err) {
      showToast('Booking failed: ' + err.message, 'error');
    } finally {
      bookBtn.disabled = false;
      if (btnText) btnText.classList.remove('hidden');
      if (btnLoading) btnLoading.classList.add('hidden');
      updateBookBtnState();
    }
  });

  renderServices();
  const today = new Date().toISOString().split('T')[0];
  if (dateInput) {
    dateInput.min = today;
    dateInput.value = today;
  }
  renderSlots();
  renderBookings();
}
