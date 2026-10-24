// ============================================================
//  ORDER (pre-order) — form giao hàng, thanh toán QR, tra cứu đơn hàng
//  Chỉ chạy khi MODE === 'order'. Cần nạp SAU core.js.
// ============================================================

extendI18N({
  vi: {
    preorderTitle: 'Thời gian pre-order',
    sidebarNote: '<strong>Lưu ý:</strong> Tụi mình chỉ giải quyết khiếu nại khi có video unbox không cắt ghép, nên các bạn hãy quay video khi nhận hàng nhé!',
    trackBtn: 'Tra cứu đơn hàng',
    trackTitle: 'Tra cứu vận đơn',
    trackHint: 'Nhập mã đơn hàng để kiểm tra:',
    trackPh: 'Ví dụ: TOT2608031234',
    search: 'Tìm kiếm',
    shipTitle: 'Thông tin giao hàng',
    phPhone: 'Số điện thoại (*)',
    phName: 'Họ và tên người nhận (*)',
    phAddr: 'Địa chỉ giao hàng (*)',
    phFb: 'Link Facebook (*)',
    payTitle: 'Thanh toán để hoàn thành đơn',
    orderCode: 'Mã đơn:',
    paidConfirm: 'Xác nhận đã thanh toán',
    orderSuccess: 'Đặt hàng thành công!',
    paySuccess1: 'Đơn hàng đang được xác nhận thanh toán. Bạn sẽ nhận email thông báo trong vòng 1-2 ngày (*ᴗ͈ˬᴗ͈)ꕤ*.ﾟ',
    paySuccess2: 'Nếu có gì thắc mắc, hãy nhắn tin qua fanpage <b>Theatre of Tales</b> để tụi mình hỗ trợ nhé ദ്ദി(｡•̀ ,&lt;)~✩‧₊',
    seeYou: 'Hẹn gặp lại',
    confirmOrder: 'Xác nhận đơn Hàng',
    min100: 'Đơn hàng của bạn phải có giá trị tối thiểu 100k',
    errPhone: 'Số điện thoại không hợp lệ (10 số)!',
    errName: 'Vui lòng nhập Họ tên!',
    errEmail: 'Email không đúng định dạng!',
    errAddr: 'Vui lòng nhập Địa chỉ!',
    errFb: 'Vui lòng nhập Link Facebook!',
    enterCode: 'Vui lòng nhập mã đơn hàng!',
    noOrderId: 'Server không trả về mã đơn hàng.',
    waiting: 'Chờ tụi mình xíu nha...'
  },
  en: {
    preorderTitle: 'Pre-order period',
    sidebarNote: '<strong>Note:</strong> We only handle complaints when there is an uncut unboxing video, so please record a video when you receive your order!',
    trackBtn: 'Track order',
    trackTitle: 'Track your order',
    trackHint: 'Enter your order code to check:',
    trackPh: 'e.g. TOT2608031234',
    search: 'Search',
    shipTitle: 'Shipping information',
    phPhone: 'Phone number (*)',
    phName: 'Recipient full name (*)',
    phAddr: 'Shipping address (*)',
    phFb: 'Facebook link (*)',
    payTitle: 'Pay to complete your order',
    orderCode: 'Order code:',
    paidConfirm: 'Confirm payment made',
    orderSuccess: 'Order placed successfully!',
    paySuccess1: 'Your payment is being verified. You will receive a confirmation email within 1-2 days (*ᴗ͈ˬᴗ͈)ꕤ*.ﾟ',
    paySuccess2: 'If you have any questions, message our <b>Theatre of Tales</b> fanpage and we will be happy to help ദ്ദി(｡•̀ ,&lt;)~✩‧₊',
    seeYou: 'See you again',
    confirmOrder: 'Confirm order',
    min100: 'Your order must be at least 100,000 VND',
    errPhone: 'Invalid phone number (10 digits)!',
    errName: 'Please enter your full name!',
    errEmail: 'Invalid email address!',
    errAddr: 'Please enter your address!',
    errFb: 'Please enter your Facebook link!',
    enterCode: 'Please enter an order code!',
    noOrderId: 'The server did not return an order code.',
    waiting: 'Just a moment...'
  }
});

// ---------- CHỐT ĐƠN: kiểm tra form giao hàng rồi tạo mã QR ----------
async function submitOrderPO() {
  clearErrors();

  const totalCartAmount = cartTotal();
  if (totalCartAmount < (SITE_CONFIG.ORDER_MIN_AMOUNT || 0)) return showToast(t('min100'));

  const p = document.getElementById('custPhone').value.trim(), n = document.getElementById('custName').value.trim();
  const em = document.getElementById('custEmail').value.trim(), a = document.getElementById('custAddress').value.trim();
  const fb = document.getElementById('custFb').value.trim(), note = document.getElementById('custNote').value.trim();

  let valid = true;
  if (!p || !/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(p)) { showError('custPhone', 'errPhone', t('errPhone')); valid = false; }
  if (!n) { showError('custName', 'errName', t('errName')); valid = false; }
  if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { showError('custEmail', 'errEmail', t('errEmail')); valid = false; }
  if (!a) { showError('custAddress', 'errAddress', t('errAddr')); valid = false; }
  if (!fb) { showError('custFb', 'errFb', t('errFb')); valid = false; }

  if (!valid) return showToast(t('fillAll'));

  const cInfo = { phone: p, name: n, email: em, address: a, facebook: fb, note: note };
  const btn = document.getElementById('btnSubmitOrder');
  btn.disabled = true; btn.innerText = t('processing');

  currentTempOrder.customerInfo = cInfo; currentTempOrder.cartItems = cart;

  try {
    const res = await callApi('createOrderTemp', { customerInfo: cInfo, cartItems: cart });
    if (!res || !res.orderId) throw new Error(t('noOrderId'));
    btn.disabled = false; btn.innerText = t('confirmOrder');
    currentTempOrder.orderId = res.orderId; currentTempOrder.totalAmount = res.totalAmount;
    showQrModal(res);
  } catch (err) {
    btn.disabled = false; btn.innerText = t('confirmOrder');
    showToast(t('error') + ': ' + err.message);
  }
}

// ---------- XÁC NHẬN ĐÃ CHUYỂN KHOẢN: ghi đơn vào "Đơn Hàng PO" ----------
async function confirmPaymentPO() {
  const btn = document.getElementById('btnPaidConfirm');
  btn.disabled = true; btn.innerText = t('confirming');
  try {
    await callApi('confirmOrderPO', {
      customerInfo: currentTempOrder.customerInfo,
      cartItems: currentTempOrder.cartItems,
      orderId: currentTempOrder.orderId,
      totalAmount: currentTempOrder.totalAmount
    });
    clearPendingOrder();
    document.getElementById('qrStep1').style.display = 'none';
    document.getElementById('qrStep2').style.display = 'block';
    if (MODE !== 'order') showToast(t('orderSuccess'));
    cart = [];
    updateCartBadge();
    btn.disabled = false;
    btn.innerText = t('paidConfirm');
  } catch (err) {
    alert(t('error') + ': ' + err.message);
    btn.disabled = false;
    btn.innerText = t('paidConfirm');
  }
}

// ---------- TRA CỨU ĐƠN HÀNG ----------
async function trackOrder() {
  const code = document.getElementById('trackInput').value.trim();
  const res = document.getElementById('trackResult');
  if (!code) return res.innerHTML = `<p style='color:red; font-size:13px;'>${t('enterCode')}</p>`;

  res.innerHTML = `<p style='text-align:center; color:#555;'>${t('waiting')}</p>`;
  try {
    const data = await callApi('trackOrderCode', { orderId: code, lang: currentLang });
    res.innerHTML = data.html;
  } catch (err) {
    res.innerHTML = `<p style='color:red; text-align:center;'>${t('connError')}</p>`;
  }
}

function closeReceiptPopup() {
  const popup = document.getElementById('receiptPopupOverlay');
  if (popup) popup.remove();
}
