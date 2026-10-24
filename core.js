// ============================================================
//  CORE — phần dùng chung cho cả Order và Keep fes
//  (API, ngôn ngữ, danh mục, chi tiết sản phẩm, lịch fes, giỏ hàng)
//  Cần nạp SAU config.js và TRƯỚC order.js / keep.js
// ============================================================

// ---------- CHẾ ĐỘ HIỆN TẠI: 'order' | 'keep' | 'closed' ----------
const MODE = (function () {
  if (SITE_CONFIG.ORDER_OPEN && SITE_CONFIG.KEEP_OPEN) {
    console.warn('Cả ORDER_OPEN và KEEP_OPEN đều bật. Web ưu tiên chế độ Order.');
  }
  if (SITE_CONFIG.ORDER_OPEN) return 'order';
  if (SITE_CONFIG.KEEP_OPEN) return 'keep';
  return 'closed';
})();
const IS_STORE_OPEN = MODE !== 'closed';
const CAN_TRACK_ORDER = MODE === 'order' || (MODE === 'closed' && !!SITE_CONFIG.SHOW_TRACKING_WHEN_CLOSED);

document.body.dataset.mode = MODE;

// ---------- TRẠNG THÁI ----------
let productsData = [], cart = [], currentActiveImgUrl = "", currentSelectedProdIdx = null, toastTimeout = null;
let currentTempOrder = { customerInfo: null, cartItems: null, orderId: '', totalAmount: 0, paymentMethod: '', qrUrl: '', mode: '' };
let selectedOptionIndex = 0;
let currentLang = 'vi', productsLoaded = false, fesEventsData = [];

// order.js / keep.js đăng ký hàm khởi tạo riêng của chúng vào đây
const modeInitHooks = [];

// ---------- NGÔN NGỮ ----------
const I18N = {
  vi: {
    fesBtn: 'Lịch fes tham gia',
    sidebarText: 'Nếu có thắc mắc gì, hãy nhắn tụi mình qua các kênh social dưới đây để được giải đáp sớm nhất nha!',
    searchPh: 'Tìm kiếm sản phẩm hoặc nhân vật...',
    loadingHtml: 'Đang kiểm tra vé<span>.</span><span>.</span><span>.</span>',
    descTitle: 'Mô tả sản phẩm:',
    optionsTitle: 'Các lựa chọn có sẵn:',
    fesTitle: 'Lịch Fes Tham Gia',
    cartTitle: 'Giỏ hàng của bạn',
    phNote: 'Ghi chú đơn hàng',
    totalMoney: 'Tổng tiền:',
    vnd: 'VNĐ',
    scanQr: 'Quét mã QR bên dưới để chuyển khoản:',
    closed: 'Tụi mình đang tạm nghỉ rồi. Bạn hãy quay lại sau nha!',
    f12: 'Không cho F12 đấy lêu lêu!',
    noResult: 'Không tìm thấy sản phẩm phù hợp.',
    from: 'Từ',
    newProducts: 'Sản phẩm mới',
    noDesc: 'Chưa có mô tả cho sản phẩm này.',
    displayOnly: 'Hàng trưng bày chưa bán',
    huh: 'Hả?',
    soldOutBtn: 'Hết hàng thật rồi mà!',
    addToCart: 'Thêm vào giỏ hàng',
    soldOutToast: 'Sản phẩm này đã hết hàng!',
    onlyLeft: 'Chỉ còn {n} sản phẩm này thui nha!',
    onlyLeftShort: 'Chỉ còn {n} thui nha!',
    added: 'Đã thêm {n} sản phẩm vào giỏ!',
    fesLoading: 'Đang tải lịch fes...',
    loadError: 'Lỗi tải dữ liệu',
    updating: 'Đang cập nhật',
    noFes: 'Hiện chưa có lịch fes nào được cập nhật.',
    upcoming: 'Sắp diễn ra',
    booth: 'Gian',
    cartEmpty: 'Ở đây trống trải quá...',
    total: 'Tổng:',
    fillAll: 'Hãy điền đủ thông tin giúp tụi mình nha!',
    processing: 'Đang xử lý...',
    confirming: 'Đang xác nhận...',
    error: 'Lỗi',
    stockNotice: 'Chỉ còn {n} sản phẩm!',
    httpError: 'Server trả về HTTP',
    serverError: 'Server báo lỗi.',
    slow: 'Server phản hồi quá lâu (hơn 20 giây). Hãy kiểm tra deployment Apps Script.',
    connError: 'Lỗi kết nối server!',
    phEmail: 'Email (*)',
    pendingMsg: 'Bạn có một đơn đang chờ xác nhận thanh toán.',
    pendingOpen: 'Mở lại mã QR',
    pendingHint: 'Đã chuyển khoản xong? Hãy quay lại đây bấm xác nhận. Nếu lỡ thoát trang, đơn vẫn được giữ lại trên máy này.',
    pendingCancel: 'Hủy đơn này',
    pendingCancelConfirm: 'Hủy đơn này? Nếu bạn ĐÃ chuyển khoản thì đừng hủy, hãy bấm "Xác nhận đã thanh toán" nhé.',
    close: 'Đóng'
  },
  en: {
    fesBtn: 'Event schedule',
    sidebarText: 'If you have any questions, message us on the social channels below and we will get back to you as soon as we can!',
    searchPh: 'Search products or characters...',
    loadingHtml: 'Checking tickets<span>.</span><span>.</span><span>.</span>',
    descTitle: 'Product description:',
    optionsTitle: 'Available options:',
    fesTitle: 'Event Schedule',
    cartTitle: 'Your cart',
    phNote: 'Order note',
    totalMoney: 'Total:',
    vnd: 'VND',
    scanQr: 'Scan the QR code below to make a bank transfer:',
    closed: 'We are taking a short break. Please come back later!',
    f12: 'No F12 for you, nyah nyah!',
    noResult: 'No matching products found.',
    from: 'From',
    newProducts: 'New arrivals',
    noDesc: 'No description for this product yet.',
    displayOnly: 'Display item, not for sale',
    huh: 'Huh?',
    soldOutBtn: 'Really sold out!',
    addToCart: 'Add to cart',
    soldOutToast: 'This item is sold out!',
    onlyLeft: 'Only {n} of this item left!',
    onlyLeftShort: 'Only {n} left!',
    added: 'Added {n} item(s) to your cart!',
    fesLoading: 'Loading event schedule...',
    loadError: 'Failed to load data',
    updating: 'To be updated',
    noFes: 'No events have been announced yet.',
    upcoming: 'Upcoming',
    booth: 'Booth',
    cartEmpty: 'It is so empty here...',
    total: 'Total:',
    fillAll: 'Please fill in all the required information!',
    processing: 'Processing...',
    confirming: 'Confirming...',
    error: 'Error',
    stockNotice: 'Only {n} left!',
    httpError: 'Server returned HTTP',
    serverError: 'Server reported an error.',
    slow: 'The server took too long to respond (over 20 seconds). Please check the Apps Script deployment.',
    connError: 'Server connection error!',
    phEmail: 'Email (*)',
    pendingMsg: 'You have an order waiting for payment confirmation.',
    pendingOpen: 'Reopen QR code',
    pendingHint: 'Already paid? Come back here and tap confirm. If you leave the page, your order is kept on this device.',
    pendingCancel: 'Cancel this order',
    pendingCancelConfirm: 'Cancel this order? If you HAVE already paid, do not cancel: tap "Confirm payment made" instead.',
    close: 'Close'
  }
};

// order.js / keep.js dùng hàm này để thêm chuỗi riêng của flow
function extendI18N(extra) {
  ['vi', 'en'].forEach(function (l) { Object.assign(I18N[l], extra[l] || {}); });
}

const FES_STATUS_EN = { 'sắp diễn ra': 'Upcoming', 'đang diễn ra': 'Ongoing', 'đã kết thúc': 'Ended' };

try {
  currentLang = localStorage.getItem('tot_lang') || ((navigator.language || 'vi').toLowerCase().indexOf('vi') === 0 ? 'vi' : 'en');
} catch (e) { currentLang = (navigator.language || 'vi').toLowerCase().indexOf('vi') === 0 ? 'vi' : 'en'; }

function t(key, vars) {
  let s = (I18N[currentLang] && I18N[currentLang][key]);
  if (s === undefined) s = I18N.vi[key];
  if (s === undefined) s = key;
  if (vars) Object.keys(vars).forEach(k => { s = s.replace('{' + k + '}', vars[k]); });
  return s;
}
function fmt(n) { n = Number(n) || 0; return currentLang === 'en' ? n.toLocaleString('en-US') : n.toLocaleString(); }
function money(n) { return fmt(n) + (currentLang === 'en' ? ' VND' : 'đ'); }
function pName(p) { return (currentLang === 'en' && p.nameEn) ? p.nameEn : p.name; }
function pDesc(p) {
  const d = (currentLang === 'en' && p.descriptionEn) ? p.descriptionEn : p.description;
  return d || t('noDesc');
}
function cartName(item) { return (currentLang === 'en' && item.nameEn) ? item.nameEn : item.name; }
function optLabel(name) { return (currentLang === 'en' && name === 'Mặc định') ? 'Default' : name; }
function cartTotal() { return cart.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0); }

function setLang(l) {
  currentLang = l;
  try { localStorage.setItem('tot_lang', l); } catch (e) {}
  applyLang();
}

// Phần tử có thể khai báo thêm key riêng cho chế độ Keep:
//   data-i18n="preorderTitle" data-i18n-keep="keepTitle"
function i18nKey(el, base) {
  return (MODE === 'keep' && el.dataset[base + 'Keep']) || el.dataset[base];
}

function renderModeBox() {
  const timeEl = document.getElementById('modeTime');
  if (!timeEl) return;
  const period = MODE === 'order' ? SITE_CONFIG.ORDER_PERIOD : (MODE === 'keep' ? SITE_CONFIG.KEEP_PERIOD : '');
  timeEl.textContent = period || t('updating');
}

function applyLang() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll('[data-i18n],[data-i18n-keep]').forEach(el => {
    if (el.disabled) return;   // nút đang xử lý giữ nguyên chữ "Đang xác nhận..."
    const k = i18nKey(el, 'i18n'); if (k) el.textContent = t(k);
  });
  document.querySelectorAll('[data-i18n-html],[data-i18n-html-keep]').forEach(el => {
    const k = i18nKey(el, 'i18nHtml'); if (k) el.innerHTML = t(k);
  });
  document.querySelectorAll('[data-i18n-placeholder],[data-i18n-placeholder-keep]').forEach(el => {
    const k = i18nKey(el, 'i18nPlaceholder'); if (k) el.placeholder = t(k);
  });
  const bv = document.getElementById('langBtnVi'), be = document.getElementById('langBtnEn');
  if (bv) bv.classList.toggle('active', currentLang === 'vi');
  if (be) be.classList.toggle('active', currentLang === 'en');
  const bc = document.getElementById('storeBannerContainer');
  if (bc) bc.innerHTML = IS_STORE_OPEN ? '' : `<div class="store-closed-banner">（*＾-＾*）${t('closed')}</div>`;
  renderModeBox();
  if (productsLoaded) filterProducts();
  if (currentSelectedProdIdx !== null && document.getElementById('detailView').style.display === 'block') refreshDetailLang();
  const fv = document.getElementById('fesCalendarView');
  if (fv && fv.style.display === 'block' && fesEventsData.length) renderFesTimeline(fesEventsData);
  renderCart();
}

function refreshDetailLang() {
  const prod = productsData[currentSelectedProdIdx];
  if (!prod) return;
  document.getElementById('detailTitle').innerText = pName(prod);
  document.getElementById('detailDescription').innerText = pDesc(prod);
  const opts = (prod.options && prod.options.length > 0) ? prod.options : [{ optionName: "Mặc định", price: prod.price, stock: prod.stock || 9999 }];
  document.querySelectorAll('.option-pill-btn').forEach((p, i) => { if (opts[i]) p.textContent = optLabel(opts[i].optionName); });
  updateSelectedOptionPrice(opts[selectedOptionIndex]);
  const q = document.getElementById('selectedQty');
  const keep = q.disabled ? null : q.value;
  updateActionBtnState();
  if (keep && !q.disabled) q.value = keep;
}

// ---------- GỌI API ----------
// Trong Apps Script  : google.script.run.apiDispatch(action, payload)
// Trên GitHub        : fetch tới SITE_CONFIG.API_URL
const RUNNING_IN_APPS_SCRIPT = (typeof google !== 'undefined' && google.script && google.script.run);
const API_TIMEOUT_MS = 30000;
const API_GET_ACTIONS = ['ping', 'getProducts', 'getEvents', 'trackOrderCode'];

function callApi(action, payload) {
  payload = payload || {};

  if (RUNNING_IN_APPS_SCRIPT) {
    return new Promise(function (resolve, reject) {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(function (err) { reject(new Error((err && err.message) || String(err))); })
        .apiDispatch(action, payload);
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, API_TIMEOUT_MS);
  let url = SITE_CONFIG.API_URL + '?action=' + encodeURIComponent(action);
  const opts = { signal: controller.signal };

  if (API_GET_ACTIONS.indexOf(action) !== -1) {
    Object.keys(payload).forEach(function (k) {
      url += '&' + encodeURIComponent(k) + '=' + encodeURIComponent(payload[k]);
    });
  } else {
    opts.method = 'POST';
    opts.headers = { 'Content-Type': 'text/plain;charset=utf-8' };   // tránh preflight CORS
    opts.body = JSON.stringify(payload);
  }

  return fetch(url, opts)
    .then(function (res) {
      if (!res.ok) throw new Error(t('httpError') + ' ' + res.status);
      return res.json();
    })
    .then(function (json) {
      if (!json || json.ok !== true) throw new Error((json && json.error) || t('serverError'));
      return json.data;
    })
    .catch(function (err) {
      if (err && err.name === 'AbortError') throw new Error(t('slow'));
      throw err;
    })
    .finally(function () { clearTimeout(timer); });
}

// ---------- KHỞI TẠO ----------
window.addEventListener('DOMContentLoaded', function () {
  const modeBox = document.getElementById('modeBox');
  if (modeBox) modeBox.style.display = IS_STORE_OPEN ? '' : 'none';
  const modeNote = document.getElementById('modeNote');
  if (modeNote) modeNote.style.display = IS_STORE_OPEN ? '' : 'none';
  const trackBtn = document.getElementById('btnTrackOrder');
  if (trackBtn) trackBtn.style.display = CAN_TRACK_ORDER ? '' : 'none';

  modeInitHooks.forEach(function (fn) { fn(); });
  applyLang();
  restorePendingOrder();   // khách tải lại trang giữa chừng => mở lại QR + nút xác nhận

  callApi('getProducts').then(renderProducts).catch(function (err) {
    console.error(err);
    const loadingBox = document.getElementById('loadingBox');
    if (loadingBox) loadingBox.style.display = 'none';
    const container = document.getElementById('catalogContainer');
    if (container) container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:30px; color:#d32f2f;">${t('loadError')}: ${err.message}</div>`;
  });

  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      showToast(t('f12'));
    }
  });
});

// ---------- DANH MỤC SẢN PHẨM ----------
function renderProducts(products) {
  productsData = products || [];
  productsLoaded = true;
  const loadingBox = document.getElementById('loadingBox');
  if (loadingBox) loadingBox.style.display = 'none';
  filterProducts();
}

function filterProducts() {
  const searchInput = document.getElementById('searchInput');
  const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const container = document.getElementById('catalogContainer');
  if (!container) return;

  const filtered = productsData.filter(p => {
    const matchName = (p.name && p.name.toLowerCase().includes(keyword)) || (p.nameEn && p.nameEn.toLowerCase().includes(keyword));
    const matchOption = p.options && p.options.some(o => o.optionName && o.optionName.toLowerCase().includes(keyword));
    return matchName || matchOption;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:30px; color:#666;">${t('noResult')}</div>`;
    return;
  }

  const newProducts = filtered.filter(p => p.isNew === true);
  const otherProducts = filtered.filter(p => p.isNew !== true);
  let htmlOutput = '';

  const renderGridHtml = (prodList) => {
    return `<div class="products-grid">` + prodList.map((p) => {
      const idx = productsData.findIndex(item => item.name === p.name);
      const prodName = pName(p);
      const priceText = t('from') + ' ' + money(p.price);
      return `
        <div class="product-card" onclick="openProductDetail(${idx})">
          <div><img src="${p.images && p.images[0] ? p.images[0] : ''}"><h4>${prodName}</h4></div>
          <div><span class="price-pill">${priceText}</span></div>
        </div>`;
    }).join('') + `</div>`;
  };

  if (newProducts.length > 0) {
    htmlOutput += `<div class="section-title" style="margin-bottom: 15px; font-weight: bold; font-size: 1.2rem;">${t('newProducts')}</div>`;
    htmlOutput += renderGridHtml(newProducts);
  }
  if (newProducts.length > 0 && otherProducts.length > 0) {
    htmlOutput += `<div class="catalog-divider">‎‧₊˚✧Theatre of Tales✧˚₊‧</div>`;
  }
  if (otherProducts.length > 0) {
    htmlOutput += renderGridHtml(otherProducts);
  }
  container.innerHTML = htmlOutput;
}

// ---------- CHI TIẾT SẢN PHẨM ----------
function defaultOptions(prod) {
  return (prod.options && prod.options.length > 0) ? prod.options : [{ optionName: "Mặc định", price: prod.price, stock: prod.stock || 9999 }];
}

function openProductDetail(prodIdx) {
  currentSelectedProdIdx = prodIdx;
  selectedOptionIndex = 0;
  const prod = productsData[prodIdx];
  currentActiveImgUrl = prod.images && prod.images[0] ? prod.images[0] : '';
  document.getElementById('detailMainImg').src = currentActiveImgUrl;
  const thumbContainer = document.getElementById('thumbnailList');
  if (prod.images && prod.images.length > 1) {
    thumbContainer.innerHTML = prod.images.map((imgUrl, i) => `<img src="${imgUrl}" class="thumb-img ${i===0?'active':''}" onclick="switchMainImg('${imgUrl}', this)">`).join('');
    thumbContainer.style.display = 'flex';
  } else { thumbContainer.style.display = 'none'; }

  document.getElementById('detailTitle').innerText = pName(prod);
  document.getElementById('detailDescription').innerText = pDesc(prod);

  const optListContainer = document.getElementById('detailOptionList');
  const optionsToRender = defaultOptions(prod);

  optListContainer.innerHTML = optionsToRender.map((opt, oIdx) => {
    const isSoldOut = (parseInt(opt.stock) === 0);
    return `
      <div class="option-pill-btn ${oIdx === 0 ? 'active' : ''} ${isSoldOut ? 'sold-out' : ''}" onclick="selectOption(${oIdx})">
        ${optLabel(opt.optionName)}
      </div>`;
  }).join('');
  updateSelectedOptionPrice(optionsToRender[0]);

  const qtyInput = document.getElementById('selectedQty');
  qtyInput.type = "number";
  qtyInput.value = 1;

  updateActionBtnState();
  document.getElementById('catalogView').style.display = 'none';
  document.getElementById('detailView').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateSelectedOptionPrice(opt) {
  const priceElem = document.getElementById('detailPrice');
  if (opt && opt.price !== undefined) {
    priceElem.innerText = `${money(opt.price)}`;
  } else {
    const prod = productsData[currentSelectedProdIdx];
    priceElem.innerText = `${money(prod.price)}`;
  }
}

function selectOption(oIdx) {
  selectedOptionIndex = oIdx;
  const prod = productsData[currentSelectedProdIdx];
  const selectedOpt = defaultOptions(prod)[oIdx];
  updateSelectedOptionPrice(selectedOpt);

  document.querySelectorAll('.option-pill-btn').forEach((p, idx) => {
    if (idx === oIdx) p.classList.add('active');
    else p.classList.remove('active');
  });
  updateActionBtnState();
}

function updateActionBtnState() {
  const actionContainer = document.getElementById('actionBtnContainer');
  const qtyInput = document.getElementById('selectedQty');
  const prod = productsData[currentSelectedProdIdx];
  const currentOpt = defaultOptions(prod)[selectedOptionIndex];
  const isSoldOut = (parseInt(currentOpt.stock) === 0);

  // Hiện số lượng còn lại khi stock dưới 10 (và chưa hết hàng)
  const stockNotice = document.getElementById('stockNotice');
  const stockNum = parseInt(currentOpt.stock);
  if (IS_STORE_OPEN && stockNum > 0 && stockNum < 10) {
    stockNotice.innerText = t('stockNotice', { n: stockNum });
    stockNotice.classList.add('show');
  } else {
    stockNotice.innerText = '';
    stockNotice.classList.remove('show');
  }

  if (!IS_STORE_OPEN) {
    qtyInput.type = "number";
    qtyInput.disabled = false;
    qtyInput.value = 1;
    actionContainer.innerHTML = `<button class="btn btn-disabled btn-add-cart" disabled>${t('displayOnly')}</button>`;
  } else if (isSoldOut) {
    qtyInput.type = "text";
    qtyInput.value = t('huh');
    qtyInput.disabled = true;
    actionContainer.innerHTML = `<button class="btn btn-disabled btn-add-cart" disabled>${t('soldOutBtn')}</button>`;
  } else {
    qtyInput.type = "number";
    qtyInput.disabled = false;
    qtyInput.value = 1;
    actionContainer.innerHTML = `<button class="btn btn-success btn-add-cart" onclick="addCurrentOptionToCart()">${t('addToCart')}</button>`;
  }
}

function changeQty(delta) {
  if (!IS_STORE_OPEN) return showToast(t('displayOnly'));
  const input = document.getElementById('selectedQty');
  if (input.disabled) return;
  let val = parseInt(input.value) || 1;
  val = Math.max(1, val + delta);
  input.value = val;
}

function onInputQty() {
  const input = document.getElementById('selectedQty');
  if (input.disabled) return;
  let val = parseInt(input.value) || 1;
  if (val < 1) input.value = 1;
}

function addCurrentOptionToCart() {
  if (!IS_STORE_OPEN) return showToast(t('displayOnly'));
  const prod = productsData[currentSelectedProdIdx];
  const opt = defaultOptions(prod)[selectedOptionIndex];

  if (parseInt(opt.stock) === 0) return showToast(t('soldOutToast'));

  const input = document.getElementById('selectedQty');
  const qty = parseInt(input.value) || 1;
  const maxStock = opt.stock ? parseInt(opt.stock) : 9999;
  const cartKey = `${prod.name}_${opt.optionName}`;
  const existing = cart.find(i => i.key === cartKey);
  const currentCartQty = existing ? existing.quantity : 0;

  if (currentCartQty + qty > maxStock) return showToast(t('onlyLeft', { n: maxStock }));

  if (existing) existing.quantity += qty;
  else cart.push({ key: cartKey, name: prod.name, nameEn: prod.nameEn, option: opt.optionName, price: opt.price, quantity: qty, stock: maxStock });

  updateCartBadge();
  showToast(t('added', { n: qty }));
  input.value = 1;
}

function switchMainImg(url, el) {
  currentActiveImgUrl = url;
  document.getElementById('detailMainImg').src = url;
  document.querySelectorAll('.thumb-img').forEach(e => e.classList.remove('active'));
  el.classList.add('active');
}

function zoomMainImage() {
  if (!currentActiveImgUrl) return;
  document.getElementById('lightboxImg').src = currentActiveImgUrl;
  document.getElementById('lightboxOverlay').style.display = 'flex';
}

function closeLightbox() { document.getElementById('lightboxOverlay').style.display = 'none'; }

function showCatalogView() {
  document.getElementById('detailView').style.display = 'none';
  const fesView = document.getElementById('fesCalendarView');
  if (fesView) fesView.style.display = 'none';
  document.getElementById('catalogView').style.display = 'block';
  currentSelectedProdIdx = null;
}

// ---------- LỊCH FES THAM GIA ----------
function openFesCalendar() {
  document.getElementById('catalogView').style.display = 'none';
  document.getElementById('detailView').style.display = 'none';
  document.getElementById('fesCalendarView').style.display = 'block';
  document.getElementById('fesTimelineContainer').innerHTML = `<div style="text-align:center;padding:40px;color:#666;">${t('fesLoading')}</div>`;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  callApi('getEvents')
    .then(renderFesTimeline)
    .catch(err => {
      document.getElementById('fesTimelineContainer').innerHTML = `<div style="text-align:center;padding:40px;color:#d32f2f;">${t('loadError')}: ${err.message}</div>`;
    });
}

function parseFesDate(str) {
  if (!str) return null;
  const parts = String(str).trim().split('/');
  if (parts.length !== 3) return null;
  return { dd: parts[0], mm: parts[1], yyyy: parts[2] };
}

function buildFesDateBlock(ev) {
  const start = parseFesDate(ev.startDate);
  const end = parseFesDate(ev.endDate);
  let dateText = t('updating');
  let yearText = "";

  if (start && end) {
    const sameDay = (start.dd === end.dd && start.mm === end.mm && start.yyyy === end.yyyy);
    dateText = sameDay ? `${start.dd}/${start.mm}` : `${start.dd}/${start.mm} - ${end.dd}/${end.mm}`;
    yearText = (start.yyyy === end.yyyy) ? start.yyyy : `${start.yyyy} - ${end.yyyy}`;
  } else if (start) {
    dateText = `${start.dd}/${start.mm}`;
    yearText = start.yyyy;
  } else if (end) {
    dateText = `${end.dd}/${end.mm}`;
    yearText = end.yyyy;
  }

  const yearHtml = yearText ? `<div class="fes-date-year">${yearText}</div>` : "";
  return `<div class="fes-date-text">${dateText}</div>${yearHtml}`;
}

function renderFesTimeline(events) {
  fesEventsData = events || [];
  const container = document.getElementById('fesTimelineContainer');
  if (!container) return;

  if (fesEventsData.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:40px;color:#666;">${t('noFes')}</div>`;
    return;
  }

  const statusMap = { "sắp diễn ra": "status-upcoming", "đang diễn ra": "status-ongoing", "đã kết thúc": "status-ended" };

  const itemsHtml = fesEventsData.map(function (ev) {
    const statusKey = (ev.status || "").toLowerCase().trim();
    const statusClass = statusMap[statusKey] || "status-upcoming";
    const statusLabel = (currentLang === 'en' && FES_STATUS_EN[statusKey]) || ev.status || t('upcoming');
    const dateBlockHtml = buildFesDateBlock(ev);
    const imgHtml = ev.image ? `<img class="fes-event-img" src="${ev.image}" alt="${ev.name}">` : "";
    const boothHtml = ev.booth ? `<span class="fes-booth-pill">${t('booth')} ${ev.booth}</span>` : "";
    const statusHtml = `<span class="fes-status-badge ${statusClass}">${statusLabel}</span>`;
    const contentHtml = ev.content ? `<div class="fes-event-desc">${ev.content}</div>` : "";

    return `
      <div class="fes-item">
        <div class="fes-date-col">${dateBlockHtml}</div>
        <div class="fes-dot-col"><span class="fes-dot"></span></div>
        <div class="fes-right-col">
          <div class="fes-date-mobile">${dateBlockHtml}</div>
          <div class="fes-content-box">
            ${imgHtml}
            <div class="fes-event-name">${(ev.name || '').toUpperCase()}</div>
            <div class="fes-meta-row">${boothHtml}${statusHtml}</div>
            ${contentHtml}
          </div>
        </div>
      </div>`;
  }).join('');

  container.innerHTML = `<div class="fes-timeline">${itemsHtml}</div>`;
}

// ---------- TIỆN ÍCH GIAO DIỆN ----------
function showToast(msg) {
  let el = document.getElementById('toastNotification');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toastNotification'; el.className = 'toast-notification';
    document.body.appendChild(el);
  }
  el.innerText = msg;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.remove('show'), 2800);
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function clearErrors() {
  document.querySelectorAll('#cartModal .input-error').forEach(el => el.classList.remove('input-error'));
  document.querySelectorAll('#cartModal .error-msg').forEach(el => { el.innerText = ''; el.style.display = 'none'; });
}

function showError(fId, eId, msg) {
  const e = document.getElementById(eId), f = document.getElementById(fId);
  if (e) { e.innerText = msg; e.style.display = 'block'; }
  if (f) { f.classList.add('input-error'); f.focus(); }
}

// ---------- GIỎ HÀNG ----------
function updateCartBadge() { document.getElementById('cartCount').innerText = cart.reduce((s, i) => s + i.quantity, 0); }
function openCartModal() { clearErrors(); renderCart(); openModal('cartModal'); }

function renderCart() {
  const container = document.getElementById('cartList');
  const btnSubmit = document.getElementById('btnSubmitOrder');
  if (cart.length === 0) {
    container.innerHTML = `<div style='text-align:center;padding:20px;color:#666;'>${t('cartEmpty')}</div>`;
    document.getElementById('totalPrice').innerText = t('total') + ' ' + money(0);
    if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.className = "btn btn-disabled"; btnSubmit.innerText = t('cartEmpty'); }
    return;
  }
  if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.className = "btn btn-success"; btnSubmit.innerText = t(MODE === 'keep' ? 'placeOrder' : 'confirmOrder'); }

  let total = 0;
  container.innerHTML = cart.map((item, idx) => {
    total += item.price * item.quantity;
    return `
      <div class="cart-item">
        <div style="flex:1;"><b>${cartName(item)}</b><br><small>${optLabel(item.option)}</small><br><b style="color:#050c1a;">${money(item.price)}</b></div>
        <div class="qty-control">
          <button class="qty-btn" onclick="updateCartQty(${idx},-1)">-</button>
          <input type="number" class="qty-input" value="${item.quantity}" readonly>
          <button class="qty-btn" onclick="updateCartQty(${idx},1)">+</button>
        </div>
        <button onclick="removeFromCart(${idx})" class="btn-remove-item">
          <i class="fas fa-trash"></i>
        </button>
      </div>`;
  }).join('');
  document.getElementById('totalPrice').innerText = t('total') + ' ' + money(total);
}

function updateCartQty(idx, delta) {
  if (delta > 0 && cart[idx].quantity + delta > cart[idx].stock) return showToast(t('onlyLeftShort', { n: cart[idx].stock }));
  cart[idx].quantity += delta;
  if (cart[idx].quantity <= 0) cart.splice(idx, 1);
  updateCartBadge(); renderCart();
}

function removeFromCart(idx) { cart.splice(idx, 1); updateCartBadge(); renderCart(); }

// ---------- CHỐT ĐƠN: chuyển tới đúng flow theo chế độ ----------
function submitOrder(e) {
  if (e) e.preventDefault();
  if (MODE === 'order') return submitOrderPO();
  if (MODE === 'keep') return submitOrderKeep();
  showToast(t('displayOnly'));
}

function confirmPaymentDone() {
  // Dùng chế độ lúc khách tạo đơn (phòng khi web đã đổi chế độ trong lúc khách đi chuyển khoản)
  const m = currentTempOrder.mode || MODE;
  if (m === 'order') return confirmPaymentPO();
  if (m === 'keep') return confirmPaymentKeep();
}

// ---------- ĐƠN ĐANG CHỜ XÁC NHẬN THANH TOÁN (lưu trong trình duyệt) ----------
// Lưu ngay khi tạo mã QR. Nếu khách chụp QR, sang app ngân hàng rồi quay lại
// (trang bị tải lại), đơn vẫn còn để bấm "Xác nhận đã thanh toán".
const PENDING_KEY = 'tot_pending_order';
const PENDING_MAX_AGE_MS = 48 * 60 * 60 * 1000;

function savePendingOrder() {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(Object.assign({ savedAt: Date.now() }, currentTempOrder)));
  } catch (e) { console.warn('Không lưu được đơn tạm', e); }
}

function loadPendingOrder() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || !p.orderId || !p.cartItems || !p.customerInfo) return null;
    if (Date.now() - (p.savedAt || 0) > PENDING_MAX_AGE_MS) { clearPendingOrder(); return null; }
    return p;
  } catch (e) { return null; }
}

function clearPendingOrder() {
  try { localStorage.removeItem(PENDING_KEY); } catch (e) {}
  renderPendingBar();
}

function renderPendingBar() {
  const bar = document.getElementById('pendingBar');
  if (bar) bar.style.display = loadPendingOrder() ? 'flex' : 'none';
}

function fillQrModal(o) {
  document.getElementById('resOrderId').innerText = o.orderId || '';
  document.getElementById('resTotalAmount').innerText = (Number(o.totalAmount) || 0).toLocaleString();
  document.getElementById('qrImg').src = o.qrUrl;
  document.getElementById('qrStep1').style.display = 'block';
  document.getElementById('qrStep2').style.display = 'none';
  openModal('paymentModal');
}

// Mở lại QR của đơn đang chờ (từ thanh nhắc hoặc tự động sau khi tải lại trang)
function reopenPendingOrder() {
  const p = loadPendingOrder();
  if (!p) return renderPendingBar();
  currentTempOrder = {
    customerInfo: p.customerInfo, cartItems: p.cartItems, orderId: p.orderId,
    totalAmount: p.totalAmount, paymentMethod: p.paymentMethod || '', qrUrl: p.qrUrl, mode: p.mode || MODE
  };
  closeModal('cartModal');
  fillQrModal(currentTempOrder);
}

function restorePendingOrder() {
  renderPendingBar();
  if (loadPendingOrder()) reopenPendingOrder();
}

function cancelPendingOrder() {
  if (!confirm(t('pendingCancelConfirm'))) return;
  clearPendingOrder();
  closeModal('paymentModal');
}

// Hiện mã QR chuyển khoản (dùng chung cho Order và Keep) và lưu đơn tạm
function showQrModal(res) {
  currentTempOrder.mode = MODE;
  currentTempOrder.orderId = res.orderId || currentTempOrder.orderId;
  currentTempOrder.totalAmount = res.totalAmount;
  currentTempOrder.qrUrl = res.qrUrl;
  savePendingOrder();
  renderPendingBar();
  closeModal('cartModal');
  fillQrModal(currentTempOrder);
}
