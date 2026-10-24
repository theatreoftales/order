// ============================================================
//  KEEP FES — form pick up, chọn hình thức thanh toán, QR, vé tải về
//  Chỉ chạy khi MODE === 'keep'. Cần nạp SAU core.js.
// ============================================================

extendI18N({
  vi: {
    keepTitle: 'Thời gian nhận keep',
    sidebarNoteKeep: '<strong>Lưu ý:</strong> Tụi mình chỉ giải quyết việc thiếu hàng khi bạn kiểm đếm ngay tại quầy, nên các bạn hãy kiểm tra kĩ số lượng trước khi rời đi nha!',
    pickupTitle: 'Thông tin nhận hàng',
    phKeepFb: 'Link Facebook (*)',
    phPickupName: 'Tên Pick Up (*)',
    selectPickupDate: '-- Chọn Ngày pick up (*) --',
    placeOrder: 'Chốt đơn',
    payMethodTitle: 'Phương thức thanh toán',
    payMethodHint: 'Vui lòng chọn hình thức thanh toán bạn muốn sử dụng:',
    payAtFes: 'Thanh toán tại fes',
    payTransfer: 'Chuyển khoản luôn',
    payTitleKeep: 'Mã QR Thanh Toán',
    paidConfirmKeep: 'Xác nhận đã chuyển khoản',
    ticketPickupName: 'Tên Pickup: ',
    ticketPickupDate: ' | Ngày nhận keep: ',
    ticketTotal: 'TỔNG GIÁ',
    ticketFooter: 'Cảm ơn bạn đã ủng hộ tụi mình! Hãy lưu lại ảnh này trong trường hợp bạn cần ghi nhớ đơn hàng của bản thân nha! Hẹn gặp lại bạn tại Fes!',
    ticketSave: 'Lưu vé về máy',
    ticketNote: 'Ghi chú',
    ticketNoItems: 'Không có sản phẩm',
    ticketPayFes: 'Trả tại Fes',
    ticketPayTransfer: 'Chuyển khoản trước',
    errKeepEmail: 'Vui lòng nhập Email!',
    errKeepEmailFormat: 'Email không đúng định dạng!',
    errKeepFb: 'Vui lòng nhập Link Facebook!',
    errKeepName: 'Vui lòng nhập Tên pick up!',
    errKeepDate: 'Vui lòng chọn Ngày pick up!',
    errTicket: 'Lỗi khi lưu vé, bạn thử lại xem!'
  },
  en: {
    keepTitle: 'Pickup Pre-order Period',
    sidebarNoteKeep: '<strong>Note:</strong> We can only address missing items if you count them right at the booth, so please check the quantity carefully before you leave!',
    pickupTitle: 'Pickup Information',
    phKeepFb: 'Facebook Link (*)',
    phPickupName: 'Pickup Name (*)',
    selectPickupDate: '-- Select Pickup Date (*) --',
    placeOrder: 'Place Order',
    payMethodTitle: 'Payment Method',
    payMethodHint: 'Please select your preferred payment method:',
    payAtFes: 'Pay at Event',
    payTransfer: 'Bank Transfer',
    payTitleKeep: 'Payment QR Code',
    paidConfirmKeep: 'Confirm Transfer',
    ticketPickupName: 'Pickup Name: ',
    ticketPickupDate: ' | Pickup Date: ',
    ticketTotal: 'TOTAL',
    ticketFooter: 'Thank you for supporting us! Please save this image in case you need to remember your order! See you at the Fes!',
    ticketSave: 'Save Ticket',
    ticketNote: 'Note',
    ticketNoItems: 'No items',
    ticketPayFes: 'Pay at Fes',
    ticketPayTransfer: 'Bank Transfer',
    errKeepEmail: 'Please enter your Email!',
    errKeepEmailFormat: 'Invalid email address!',
    errKeepFb: 'Please enter your Facebook link!',
    errKeepName: 'Please enter your pickup name!',
    errKeepDate: 'Please select a pickup date!',
    errTicket: 'An error occurred while saving your ticket. Please try again!'
  }
});

let keepBusy = false;   // chặn bấm đúp khi đang lưu đơn

// Đổ danh sách ngày pick up (lấy từ SITE_CONFIG.KEEP_PICKUP_DATES) vào ô chọn
modeInitHooks.push(function initKeepUI() {
  const select = document.getElementById('keepPickupDate');
  if (!select) return;
  // giữ lại option đầu tiên ("-- Chọn Ngày pick up --"), thêm các ngày từ config
  while (select.options.length > 1) select.remove(1);
  (SITE_CONFIG.KEEP_PICKUP_DATES || []).forEach(function (d) {
    const opt = document.createElement('option');
    opt.value = d;
    opt.textContent = d;
    select.appendChild(opt);
  });
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ---------- CHỐT ĐƠN: kiểm tra form pick up ----------
function submitOrderKeep() {
  clearErrors();

  const email = document.getElementById('keepEmail').value.trim();
  const fb = document.getElementById('keepFb').value.trim();
  const pickupName = document.getElementById('keepPickupName').value.trim();
  const pickupDate = document.getElementById('keepPickupDate').value;
  const note = document.getElementById('keepNote').value.trim();

  let valid = true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) { showError('keepEmail', 'errKeepEmail', t('errKeepEmail')); valid = false; }
  else if (!emailRegex.test(email)) { showError('keepEmail', 'errKeepEmail', t('errKeepEmailFormat')); valid = false; }

  if (!fb) { showError('keepFb', 'errKeepFb', t('errKeepFb')); valid = false; }
  if (!pickupName) { showError('keepPickupName', 'errKeepPickupName', t('errKeepName')); valid = false; }
  if (!pickupDate) { showError('keepPickupDate', 'errKeepPickupDate', t('errKeepDate')); valid = false; }

  if (!valid) return showToast(t('fillAll'));

  currentTempOrder.customerInfo = { email: email, facebook: fb, pickupName: pickupName, pickupDate: pickupDate, note: note };
  currentTempOrder.cartItems = cart.map(function (i) { return Object.assign({}, i); });

  closeModal('cartModal');
  openModal('selectPaymentModal');
}

// ---------- CHỌN HÌNH THỨC THANH TOÁN ----------
function setPayCardsBusy(isBusy) {
  const box = document.getElementById('payOptionsBox');
  if (box) box.classList.toggle('busy', isBusy);
}

async function choosePaymentMethod(method) {
  if (keepBusy) return;
  keepBusy = true;
  setPayCardsBusy(true);

  const total = cartTotal();
  currentTempOrder.totalAmount = total;
  currentTempOrder.paymentMethod = method;

  try {
    if (method === 'fes') {
      showToast(t('processing'));
      await callApi('confirmOrderKeep', {
        customerInfo: currentTempOrder.customerInfo,
        cartItems: currentTempOrder.cartItems,
        totalAmount: total,
        paymentMethod: 'fes'
      });
      closeModal('selectPaymentModal');
      finishKeepFlow();
    } else if (method === 'transfer') {
      const res = await callApi('createOrderTemp', {
        customerInfo: currentTempOrder.customerInfo,
        cartItems: currentTempOrder.cartItems
      });
      currentTempOrder.orderId = res.orderId;
      currentTempOrder.totalAmount = res.totalAmount;
      closeModal('selectPaymentModal');
      showQrModal(res);
    }
  } catch (err) {
    showToast(t('error') + ': ' + err.message);
  } finally {
    keepBusy = false;
    setPayCardsBusy(false);
  }
}

// ---------- XÁC NHẬN ĐÃ CHUYỂN KHOẢN ----------
async function confirmPaymentKeep() {
  const btn = document.getElementById('btnPaidConfirm');
  btn.disabled = true; btn.innerText = t('confirming');
  try {
    await callApi('confirmOrderKeep', {
      customerInfo: currentTempOrder.customerInfo,
      cartItems: currentTempOrder.cartItems,
      totalAmount: currentTempOrder.totalAmount,
      paymentMethod: 'transfer',
      orderId: currentTempOrder.orderId
    });
    clearPendingOrder();
    closeModal('paymentModal');
    finishKeepFlow();
  } catch (err) {
    showToast(t('error') + ': ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerText = t('paidConfirmKeep');
  }
}

// ---------- VÉ SAU KHI ĐẶT ----------
function finishKeepFlow() {
  const info = currentTempOrder.customerInfo || {};
  populateTicketBill({
    pickupName: info.pickupName || '',
    pickupDate: info.pickupDate || '',
    note: info.note || '',
    items: currentTempOrder.cartItems || [],
    totalPrice: currentTempOrder.totalAmount || 0,
    paymentMethod: currentTempOrder.paymentMethod || 'fes'
  });
  openModal('successModal');

  cart = [];
  updateCartBadge();
  renderCart();
}

function populateTicketBill(data) {
  if (!data) return;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const elDate = document.getElementById('ticketDate');
  if (elDate) elDate.innerText = dateStr;

  const elTime = document.getElementById('ticketTime');
  if (elTime) elTime.innerText = timeStr;

  const elPickupName = document.getElementById('ticketPickupName');
  if (elPickupName) elPickupName.innerText = data.pickupName || 'N/A';

  const elPickupDate = document.getElementById('ticketPickupDate');
  if (elPickupDate) elPickupDate.innerText = data.pickupDate || 'N/A';

  const itemListContainer = document.getElementById('ticketItemList');
  if (itemListContainer) {
    itemListContainer.innerHTML = '';

    const items = data.items || [];
    if (items.length > 0) {
      const groupedItems = {};
      items.forEach(function (item) {
        const prodName = (currentLang === 'en' && item.nameEn) ? item.nameEn : (item.name || '');
        if (!groupedItems[prodName]) groupedItems[prodName] = [];
        groupedItems[prodName].push({
          option: optLabel(item.option || 'Mặc định'),
          qty: item.quantity || 1,
          price: item.price || 0
        });
      });

      for (const prodName in groupedItems) {
        const itemBlock = document.createElement('div');
        itemBlock.style.cssText = 'margin-bottom: 8px; font-size: 14px;';

        const titleHtml = `<div style="font-weight: bold; margin-bottom: 2px;">${escapeHtml(prodName)}</div>`;

        let optionsHtml = '';
        groupedItems[prodName].forEach(function (sub) {
          const subTotal = sub.price * sub.qty;
          optionsHtml += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding-left: 12px; color: #333; font-size: 13px;">
              <span style="flex: 2; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 5px;">${escapeHtml(sub.option)}</span>
              <span style="flex: 1; text-align: center;">${sub.qty}</span>
              <span style="flex: 1.5; text-align: right;">${subTotal.toLocaleString('vi-VN')}đ</span>
            </div>`;
        });

        itemBlock.innerHTML = titleHtml + optionsHtml;
        itemListContainer.appendChild(itemBlock);
      }
    } else {
      itemListContainer.innerHTML = `<div style="text-align: center;">${t('ticketNoItems')}</div>`;
    }
  }

  const noteRow = document.getElementById('ticketNoteRow');
  if (noteRow) {
    const noteVal = (data.note || '').trim();
    if (noteVal) {
      noteRow.style.display = 'block';
      noteRow.innerHTML = '<b>' + t('ticketNote') + ':</b> <i>' + escapeHtml(noteVal) + '</i>';
    } else {
      noteRow.style.display = 'none';
      noteRow.innerHTML = '';
    }
  }

  const total = data.totalPrice || 0;
  const elTotal = document.getElementById('ticketTotalPrice');
  if (elTotal) elTotal.innerText = total.toLocaleString('vi-VN') + ' VNĐ';

  const noteElement = document.getElementById('ticketPaymentNote');
  if (noteElement) {
    noteElement.innerText = (data.paymentMethod === 'transfer') ? t('ticketPayTransfer') : t('ticketPayFes');
  }
}

// ---------- LƯU VÉ VỀ MÁY ----------
// html2canvas chỉ nạp khi khách bấm "Lưu vé" (web Order không cần tải thư viện này)
function loadHtml2Canvas() {
  if (window.html2canvas) return Promise.resolve();
  return new Promise(function (resolve, reject) {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload = resolve;
    s.onerror = function () { reject(new Error('Không tải được html2canvas')); };
    document.head.appendChild(s);
  });
}

function downloadTicketImage() {
  const element = document.getElementById('ticketBillArea');
  if (!element) return;

  loadHtml2Canvas()
    .then(function () {
      return html2canvas(element, { scale: 2, useCORS: true, logging: false });
    })
    .then(function (canvas) {
      const link = document.createElement('a');
      link.download = `Ve_Fes_${new Date().getTime()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    })
    .catch(function (err) {
      console.error('Lỗi khi tải vé:', err);
      showToast(t('errTicket'));
    });
}
