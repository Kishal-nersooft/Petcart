'use strict';

(function () {
  const STORAGE_KEY = 'petcart_cart_v1';
  const SHIPPING_FLAT = 350;
  const FREE_SHIPPING_MIN = 10500;

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveCart(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function formatMoney(amount) {
    const n = Math.round(Number(amount)) || 0;
    return 'LKR ' + n.toLocaleString('en-LK', { maximumFractionDigits: 0 }) + '.00';
  }

  function formatRs(amount) {
    const n = Math.round(Number(amount)) || 0;
    return 'Rs ' + n.toLocaleString('en-LK', { maximumFractionDigits: 0 }) + '.00';
  }

  function productKeyFromCard(card) {
    const priceEl = card.querySelector('data.card-price, .card-price');
    const titleEl = card.querySelector('.card-title');
    const title = (titleEl && titleEl.textContent ? titleEl.textContent : 'Product').trim();
    const value = priceEl && (priceEl.getAttribute('value') || priceEl.value);
    return String(value || '0') + '|' + title;
  }

  function readProductFromCard(card) {
    const priceEl = card.querySelector('data.card-price, .card-price');
    const titleEl = card.querySelector('.card-title');
    const title = (titleEl && titleEl.textContent ? titleEl.textContent : 'Product').trim();
    const unit = Number(priceEl && (priceEl.getAttribute('value') || priceEl.value)) || 0;
    const priceLabel = (priceEl && priceEl.textContent ? priceEl.textContent : formatMoney(unit)).trim();
    const imgEl =
      card.querySelector('.card-banner img.img-cover.default') ||
      card.querySelector('.card-banner img.img-cover') ||
      card.querySelector('.card-banner img');
    const image = imgEl ? imgEl.getAttribute('src') || '' : '';
    return {
      key: productKeyFromCard(card),
      title,
      unit,
      priceLabel,
      image
    };
  }

  function getTotals(items) {
    const subtotal = computeSubtotal(items);
    const shipping = subtotal >= FREE_SHIPPING_MIN || subtotal === 0 ? 0 : SHIPPING_FLAT;
    return { subtotal, shipping, total: subtotal + shipping };
  }

  function updateBadges() {
    const items = loadCart();
    let count = 0;
    for (let i = 0; i < items.length; i++) count += items[i].qty;
    const badges = document.querySelectorAll('[data-cart-badge]');
    for (let i = 0; i < badges.length; i++) {
      badges[i].textContent = String(count);
    }
  }

  function addFromCard(card) {
    const p = readProductFromCard(card);
    const items = loadCart();
    let found = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].key === p.key) {
        items[i].qty += 1;
        found = true;
        break;
      }
    }
    if (!found) {
      items.push({
        key: p.key,
        title: p.title,
        unit: p.unit,
        priceLabel: p.priceLabel,
        image: p.image,
        qty: 1
      });
    }
    saveCart(items);
    updateBadges();
    return items;
  }

  function setQty(key, qty) {
    const items = loadCart();
    const q = Math.max(0, parseInt(String(qty), 10) || 0);
    const next = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].key !== key) {
        next.push(items[i]);
        continue;
      }
      if (q > 0) next.push(Object.assign({}, items[i], { qty: q }));
    }
    saveCart(next);
    updateBadges();
    return next;
  }

  function removeLine(key) {
    return setQty(key, 0);
  }

  function computeSubtotal(items) {
    let subtotal = 0;
    for (let i = 0; i < items.length; i++) {
      subtotal += items[i].unit * items[i].qty;
    }
    return subtotal;
  }

  function renderCartList(container, options) {
    options = options || {};
    const readOnly = !!options.readOnly;
    if (!container) return;
    const items = loadCart();
    container.innerHTML = '';

    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'cart-empty';
      const t1 = document.createElement('p');
      t1.className = 'cart-empty-title';
      t1.textContent = 'Your cart is empty';
      const t2 = document.createElement('p');
      t2.className = 'cart-empty-text';
      t2.textContent = 'Browse the shop and add items you love.';
      const a = document.createElement('a');
      a.href = './shop.html';
      a.className = 'btn cart-empty-btn';
      a.textContent = 'Continue shopping';
      empty.appendChild(t1);
      empty.appendChild(t2);
      empty.appendChild(a);
      container.appendChild(empty);
      return;
    }

    const list = document.createElement('ul');
    list.className = 'cart-preview-list';

    for (let i = 0; i < items.length; i++) {
      const line = items[i];
      const keyEnc = encodeURIComponent(line.key);
      const li = document.createElement('li');
      li.className = 'cart-preview-line';

      const media = document.createElement('div');
      media.className = 'cart-preview-media';
      if (line.image) {
        const img = document.createElement('img');
        img.src = line.image;
        img.width = 72;
        img.height = 72;
        img.alt = '';
        img.className = 'cart-preview-img';
        img.loading = 'lazy';
        media.appendChild(img);
      } else {
        const ph = document.createElement('div');
        ph.className = 'cart-preview-img cart-preview-img--ph';
        ph.setAttribute('aria-hidden', 'true');
        media.appendChild(ph);
      }

      const main = document.createElement('div');
      main.className = 'cart-preview-main';
      const title = document.createElement('p');
      title.className = 'cart-preview-title';
      title.textContent = line.title;
      const meta = document.createElement('p');
      meta.className = 'cart-preview-meta';
      meta.textContent = (readOnly ? '× ' + line.qty + ' · ' : '') + line.priceLabel + (readOnly ? '' : ' each');
      main.appendChild(title);
      main.appendChild(meta);
      if (!readOnly) {
        const qtyRow = document.createElement('div');
        qtyRow.className = 'cart-preview-qty';
        const dec = document.createElement('button');
        dec.type = 'button';
        dec.className = 'cart-qty-btn';
        dec.setAttribute('data-cart-qty-dec', keyEnc);
        dec.setAttribute('aria-label', 'Decrease quantity');
        dec.textContent = '−';
        const qtyVal = document.createElement('span');
        qtyVal.className = 'cart-qty-val';
        qtyVal.textContent = String(line.qty);
        const inc = document.createElement('button');
        inc.type = 'button';
        inc.className = 'cart-qty-btn';
        inc.setAttribute('data-cart-qty-inc', keyEnc);
        inc.setAttribute('aria-label', 'Increase quantity');
        inc.textContent = '+';
        qtyRow.appendChild(dec);
        qtyRow.appendChild(qtyVal);
        qtyRow.appendChild(inc);
        main.appendChild(qtyRow);
      }

      const side = document.createElement('div');
      side.className = 'cart-preview-side';
      const lineTotal = document.createElement('p');
      lineTotal.className = 'cart-preview-line-total';
      const useRs =
        readOnly &&
        typeof container.closest === 'function' &&
        container.closest('[data-checkout-app]');
      lineTotal.textContent = useRs ? formatRs(line.unit * line.qty) : formatMoney(line.unit * line.qty);
      if (!readOnly) {
        const rm = document.createElement('button');
        rm.type = 'button';
        rm.className = 'cart-remove-btn';
        rm.setAttribute('data-cart-remove', keyEnc);
        rm.setAttribute('aria-label', 'Remove item');
        rm.innerHTML = '<ion-icon name="trash-outline" aria-hidden="true"></ion-icon>';
        side.appendChild(lineTotal);
        side.appendChild(rm);
      } else {
        side.appendChild(lineTotal);
      }

      li.appendChild(media);
      li.appendChild(main);
      li.appendChild(side);
      list.appendChild(li);
    }

    container.appendChild(list);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderTotalsBlock(container) {
    if (!container) return;
    const items = loadCart();
    const t = getTotals(items);
    const shipLabel = t.shipping === 0 ? 'Free' : formatMoney(t.shipping);
    const shipNote =
      t.subtotal > 0 && t.subtotal < FREE_SHIPPING_MIN
        ? '<p class="cart-totals-hint">Add ' +
          escapeHtml(formatMoney(FREE_SHIPPING_MIN - t.subtotal)) +
          ' more for free shipping (LKR ' +
          FREE_SHIPPING_MIN.toLocaleString('en-LK') +
          '+).</p>'
        : '';

    container.innerHTML =
      '<dl class="cart-totals">' +
      '<div class="cart-totals-row"><dt>Subtotal</dt><dd>' +
      escapeHtml(formatMoney(t.subtotal)) +
      '</dd></div>' +
      '<div class="cart-totals-row"><dt>Shipping</dt><dd>' +
      shipLabel +
      '</dd></div>' +
      '<div class="cart-totals-row cart-totals-row--total"><dt>Total</dt><dd>' +
      escapeHtml(formatMoney(t.total)) +
      '</dd></div>' +
      '</dl>' +
      shipNote;
  }

  function refreshDrawer() {
    const listEl = document.querySelector('[data-cart-list]');
    const totalsEl = document.querySelector('[data-cart-totals]');
    const checkoutBtn = document.querySelector('[data-cart-checkout]');
    renderCartList(listEl);
    renderTotalsBlock(totalsEl);
    if (checkoutBtn) {
      const empty = loadCart().length === 0;
      checkoutBtn.classList.toggle('is-disabled', empty);
      checkoutBtn.setAttribute('aria-disabled', empty ? 'true' : 'false');
    }
  }

  function refreshCheckoutSummary() {
    const listEl = document.querySelector('[data-checkout-items]');
    const totalsEl = document.querySelector('[data-checkout-totals]');
    const app = document.querySelector('[data-checkout-app]');
    const readOnly =
      app &&
      window.PetCheckout &&
      typeof window.PetCheckout.isSummaryReadOnly === 'function' &&
      window.PetCheckout.isSummaryReadOnly();
    renderCartList(listEl, { readOnly: !!readOnly });
    if (app && window.PetCheckout && typeof window.PetCheckout.refreshTotals === 'function') {
      window.PetCheckout.refreshTotals();
    } else {
      renderTotalsBlock(totalsEl);
    }
    if (app && window.PetCheckout && typeof window.PetCheckout.resyncCheckoutUi === 'function') {
      window.PetCheckout.resyncCheckoutUi();
    }
  }

  let overlayEl;
  let panelEl;

  function setDrawerOpen(open) {
    if (!overlayEl || !panelEl) return;
    overlayEl.classList.toggle('is-active', open);
    panelEl.classList.toggle('is-active', open);
    panelEl.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('cart-drawer-open', open);
    if (open) refreshDrawer();
  }

  function openDrawer() {
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  function onDocumentClick(e) {
    const t = e.target;
    if (!(t instanceof Element)) return;

    const addBtn = t.closest('.product-card .card-action-btn');
    if (addBtn) {
      const card = addBtn.closest('.product-card');
      if (card) {
        addFromCard(card);
        refreshDrawer();
        refreshCheckoutSummary();
        openDrawer();
      }
      return;
    }

    if (t.closest('[data-cart-open]')) {
      openDrawer();
      return;
    }
    if (t.closest('[data-cart-close]')) {
      closeDrawer();
      return;
    }
    if (t === overlayEl) {
      closeDrawer();
      return;
    }

    const inc = t.closest('[data-cart-qty-inc]');
    if (inc) {
      const key = decodeURIComponent(inc.getAttribute('data-cart-qty-inc') || '');
      const items = loadCart();
      for (let i = 0; i < items.length; i++) {
        if (items[i].key === key) {
          setQty(key, items[i].qty + 1);
          break;
        }
      }
      refreshDrawer();
      refreshCheckoutSummary();
      return;
    }

    const dec = t.closest('[data-cart-qty-dec]');
    if (dec) {
      const key = decodeURIComponent(dec.getAttribute('data-cart-qty-dec') || '');
      const items = loadCart();
      for (let i = 0; i < items.length; i++) {
        if (items[i].key === key) {
          setQty(key, items[i].qty - 1);
          break;
        }
      }
      refreshDrawer();
      refreshCheckoutSummary();
      return;
    }

    const rm = t.closest('[data-cart-remove]');
    if (rm) {
      removeLine(decodeURIComponent(rm.getAttribute('data-cart-remove') || ''));
      refreshDrawer();
      refreshCheckoutSummary();
    }
  }

  function onKeydown(e) {
    if (e.key === 'Escape' && panelEl && panelEl.classList.contains('is-active')) closeDrawer();
  }

  function init() {
    overlayEl = document.querySelector('[data-cart-overlay]');
    panelEl = document.querySelector('[data-cart-panel]');
    updateBadges();
    refreshDrawer();
    refreshCheckoutSummary();

    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onKeydown);

    const checkout = document.querySelector('[data-cart-checkout]');
    if (checkout) {
      checkout.addEventListener('click', function (e) {
        if (loadCart().length === 0) e.preventDefault();
      });
    }
  }

  window.PetCart = {
    loadCart,
    getSubtotal: function () {
      return computeSubtotal(loadCart());
    },
    refreshDrawer,
    refreshCheckoutSummary,
    openDrawer,
    closeDrawer,
    updateBadges
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
