// Booking Module - API Integration
const API = '/api';

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
      slotSelect.innerHTML = '<option value="">Select time</option>' + slots.map(s => `<option value="${s.time}">${s.label}</option>`).join('');
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
          await renderBookings();
        } catch { console.warn('Delete failed'); }
      });
    });
  }

  dateInput?.addEventListener('change', () => {
    renderSlots();
    renderBookings();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.date = dateInput?.value || '';
    data.slot_time = slotSelect?.value || '';

    if (!data.date || !data.slot_time || !data.name || !data.phone || !data.serviceId) {
      alert('Please fill all required fields');
      return;
    }

    bookBtn.disabled = true;
    bookBtn.textContent = 'Booking...';

    try {
      await submitBooking(data);
      alert('Booking confirmed!');
      form.reset();
      await renderSlots();
      await renderBookings();
    } catch (err) {
      alert('Booking failed: ' + err.message);
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
