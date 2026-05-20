'use strict';

(function () {
  const DRAFT_KEY = 'petcart_checkout_draft_v1';

  window.PetCheckout = {
    _ready: false,
    resyncCheckoutUi: function () {},
    isSummaryReadOnly: function () {
      return false;
    },
    refreshTotals: function () {}
  };

  function formatRs(amount) {
    const n = Math.round(Number(amount)) || 0;
    return 'Rs ' + n.toLocaleString('en-LK', { maximumFractionDigits: 0 }) + '.00';
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function generateOrderId() {
    const n = Math.floor(10000 + Math.random() * 90000);
    return 'S' + n;
  }

  let step = 'address';
  let orderId = '';
  let lastDraft = null;

  function readForm() {
    const form = document.getElementById('checkout-address-form');
    if (!form) return null;
    const fd = new FormData(form);
    return {
      firstName: (fd.get('firstName') || '').toString().trim(),
      lastName: (fd.get('lastName') || '').toString().trim(),
      email: (fd.get('email') || '').toString().trim(),
      phonePrefix: (fd.get('phonePrefix') || '+94').toString().trim(),
      phone: (fd.get('phone') || '').toString().trim(),
      company: (fd.get('company') || '').toString().trim(),
      tin: (fd.get('tin') || '').toString().trim(),
      street1: (fd.get('street1') || '').toString().trim(),
      street2: (fd.get('street2') || '').toString().trim(),
      city: (fd.get('city') || '').toString().trim(),
      zip: (fd.get('zip') || '').toString().trim(),
      shipSame: form.querySelector('[name="shipSame"]') && form.querySelector('[name="shipSame"]').checked
    };
  }

  function saveDraft(d) {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch (e) {}
  }

  function loadDraft() {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function applyDraftToForm(d) {
    if (!d) return;
    const form = document.getElementById('checkout-address-form');
    if (!form) return;
    const set = function (name, val) {
      const el = form.elements.namedItem(name);
      if (el && 'value' in el) el.value = val || '';
    };
    set('firstName', d.firstName);
    set('lastName', d.lastName);
    set('email', d.email);
    set('phonePrefix', d.phonePrefix);
    set('phone', d.phone);
    set('company', d.company);
    set('tin', d.tin);
    set('street1', d.street1);
    set('street2', d.street2);
    set('city', d.city);
    set('zip', d.zip);
    const cb = form.elements.namedItem('shipSame');
    if (cb && 'checked' in cb) cb.checked = !!d.shipSame;
  }

  function formatBillingShipping(d) {
    const line1 = [d.street1, d.street2].filter(Boolean).join(', ');
    const line2 = [d.city, d.zip].filter(Boolean).join(', ');
    const tail = 'Sri Lanka';
    const parts = [line1, line2, tail].filter(function (p) {
      return p.length > 0;
    });
    return parts.join(', ');
  }

  function getDeliveryFee() {
    const sel = document.querySelector('input[name="delivery"]:checked');
    if (!sel) return 400;
    return Number(sel.value) || 0;
  }

  function getDeliveryLabel() {
    const sel = document.querySelector('input[name="delivery"]:checked');
    if (!sel) return 'Outer Colombo';
    return sel.getAttribute('data-label') || 'Delivery';
  }

  function getPaymentLabel() {
    const sel = document.querySelector('input[name="pay"]:checked');
    if (!sel) return 'Cash on Delivery';
    return sel.dataset.payLabel || 'Cash on Delivery';
  }

  function isSummaryReadOnly() {
    return step === 'confirm' || step === 'paid';
  }

  function refreshTotals() {
    const el = document.querySelector('[data-checkout-totals]');
    if (!el) return;
    const sub = window.PetCart.getSubtotal();
    const items = window.PetCart.loadCart();
    if (items.length === 0) {
      el.innerHTML = '<p class="checkout-muted">Your cart is empty.</p>';
      return;
    }

    let ship = 0;
    let shipLabel = '—';
    let total = sub;

    if (step === 'address') {
      shipLabel = 'Calculated at next step';
      total = sub;
    } else if (step === 'confirm' || step === 'paid') {
      ship = getDeliveryFee();
      shipLabel =
        ship === 0
          ? 'Free — ' + escapeHtml(getDeliveryLabel())
          : formatRs(ship) + ' — ' + escapeHtml(getDeliveryLabel());
      total = sub + ship;
    }

    el.innerHTML =
      '<dl class="cart-totals">' +
      '<div class="cart-totals-row"><dt>Subtotal</dt><dd>' +
      escapeHtml(formatRs(sub)) +
      '</dd></div>' +
      '<div class="cart-totals-row"><dt>Shipping</dt><dd>' +
      (step === 'address' ? '<span class="checkout-muted">' + escapeHtml(shipLabel) + '</span>' : escapeHtml(shipLabel)) +
      '</dd></div>' +
      '<div class="cart-totals-row cart-totals-row--total"><dt>Total</dt><dd>' +
      escapeHtml(formatRs(total)) +
      '</dd></div>' +
      '</dl>';
  }

  function setPanels() {
    document.querySelectorAll('[data-checkout-panel]').forEach(function (p) {
      const name = p.getAttribute('data-checkout-panel');
      const show =
        (step === 'address' && name === 'address') ||
        (step === 'confirm' && name === 'confirm') ||
        (step === 'paid' && name === 'paid');
      p.toggleAttribute('hidden', !show);
    });
  }

  function setStepIndicators() {
    const steps = [
      { key: 'review', done: true, current: false },
      { key: 'address', done: step !== 'address', current: step === 'address' },
      { key: 'confirm', done: step === 'paid', current: step === 'confirm' }
    ];

    document.querySelectorAll('[data-checkout-step]').forEach(function (li) {
      const k = li.getAttribute('data-checkout-step');
      const st = steps.find(function (s) {
        return s.key === k;
      });
      if (!st) return;

      li.classList.remove('checkout-step--done', 'checkout-step--current', 'checkout-step--pending');
      if (st.current) {
        li.classList.add('checkout-step--current');
        li.setAttribute('aria-current', 'step');
      } else {
        li.removeAttribute('aria-current');
        li.classList.add(st.done ? 'checkout-step--done' : 'checkout-step--pending');
      }

      const icon = li.querySelector('.checkout-step-icon');
      if (!icon) return;

      if (st.done && !st.current) {
        icon.innerHTML = '<ion-icon name="checkmark" aria-hidden="true"></ion-icon>';
        return;
      }

      if (st.current && k === 'address') {
        icon.innerHTML = '<ion-icon name="location-outline" aria-hidden="true"></ion-icon>';
        return;
      }

      if (st.current && k === 'confirm') {
        icon.innerHTML = '<ion-icon name="card-outline" aria-hidden="true"></ion-icon>';
        return;
      }

      if (k === 'review') {
        icon.innerHTML = '<ion-icon name="checkmark" aria-hidden="true"></ion-icon>';
        return;
      }

      if (k === 'address') {
        icon.innerHTML = '<span class="checkout-step-num">2</span>';
        return;
      }

      icon.innerHTML = '<span class="checkout-step-num">3</span>';
    });
  }

  function syncUI() {
    window.PetCheckout.isSummaryReadOnly = isSummaryReadOnly;
    setPanels();
    setStepIndicators();
    window.PetCart.refreshCheckoutSummary();
    refreshTotals();
    resyncCheckoutUi();
  }

  function resyncCheckoutUi() {
    const cont = document.getElementById('checkout-continue');
    if (cont) cont.disabled = window.PetCart.loadCart().length === 0;
  }

  function validateForm(d) {
    const req = ['firstName', 'lastName', 'email', 'phone', 'street1', 'city', 'zip'];
    for (let i = 0; i < req.length; i++) {
      if (!d[req[i]]) return false;
    }
    return true;
  }

  function fillConfirmAddress() {
    const d = lastDraft || readForm();
    if (!d) return;
    const el = document.querySelector('[data-confirm-billing]');
    if (el) el.textContent = formatBillingShipping(d);
  }

  function fillPaidPanel() {
    const d = lastDraft;
    const pay = getPaymentLabel();
    const sub = window.PetCart.getSubtotal();
    const ship = getDeliveryFee();
    const total = sub + ship;

    const title = document.querySelector('[data-paid-order-id]');
    if (title) title.textContent = 'Order ' + orderId;

    const payRow = document.querySelector('[data-paid-paymethod]');
    if (payRow) payRow.textContent = pay;

    const totalEl = document.querySelector('[data-paid-total]');
    if (totalEl) totalEl.textContent = formatRs(total);

    const comm = document.querySelector('[data-paid-communication]');
    if (comm) comm.textContent = orderId;

    const bill = document.querySelector('[data-paid-billing]');
    if (bill && d) bill.textContent = formatBillingShipping(d);
  }

  function init() {
    const app = document.querySelector('[data-checkout-app]');
    if (!app) return;

    applyDraftToForm(loadDraft());

    window.PetCheckout.refreshTotals = refreshTotals;
    window.PetCheckout.isSummaryReadOnly = isSummaryReadOnly;
    window.PetCheckout._ready = true;
    window.PetCheckout.resyncCheckoutUi = resyncCheckoutUi;

    const form = document.getElementById('checkout-address-form');
    const btnContinue = document.getElementById('checkout-continue');
    const btnEdit = document.getElementById('checkout-edit-address');
    const btnPay = document.getElementById('checkout-pay');

    document.querySelectorAll('input[name="delivery"]').forEach(function (r) {
      r.addEventListener('change', refreshTotals);
    });

    if (btnContinue) {
      btnContinue.addEventListener('click', function () {
        const d = readForm();
        if (!validateForm(d)) {
          alert('Please fill in all required fields.');
          return;
        }
        lastDraft = d;
        saveDraft(d);
        step = 'confirm';
        fillConfirmAddress();
        syncUI();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    if (btnEdit) {
      btnEdit.addEventListener('click', function () {
        step = 'address';
        syncUI();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    if (btnPay) {
      btnPay.addEventListener('click', function () {
        if (!lastDraft) return;
        orderId = generateOrderId();
        step = 'paid';
        fillPaidPanel();
        syncUI();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    if (form) {
      form.addEventListener('input', function () {
        saveDraft(readForm());
      });
    }

    syncUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
