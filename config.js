// ============================================================
//  CẤU HÌNH WEB THEATRE OF TALES
//  Đây là file duy nhất cần sửa khi mở/đóng Order hoặc Keep fes.
// ============================================================
const SITE_CONFIG = {

  // Link Web App Apps Script (kết thúc bằng /exec).
  // CHỈ dùng khi web chạy trên GitHub. Khi web chạy ngay trong Apps Script
  // thì tự gọi trực tiếp nên không cần link này.
  API_URL: "https://script.google.com/macros/s/AKfycbwuVELtAL3DX-Nh42mWUHWyoFKBs2GOzgYB6eR9dhScw-Eqp_w0vA340JRLuoxh0_S8/exec",

  // ---------- CHẾ ĐỘ ORDER (pre-order) ----------
  // true  => hiện thời gian order, nút tra cứu đơn hàng, và flow mua hàng của Order
  ORDER_OPEN: true,
  ORDER_PERIOD: "07/10/2026 - 20/10/2026",   // thời gian hiển thị ở thanh bên
  ORDER_MIN_AMOUNT: 100000,                  // giá trị đơn tối thiểu (VNĐ)

  // ---------- CHẾ ĐỘ KEEP FES ----------
  // true  => hiện thời gian nhận keep và flow mua hàng của Keep fes
  KEEP_OPEN: false,
  KEEP_PERIOD: "",                           // để trống => hiện "Đang cập nhật"
  KEEP_PICKUP_DATES: ["Cofi Day 1", "Cofi Day 2"],   // các ngày pick up khách được chọn

  // Khi cả ORDER_OPEN và KEEP_OPEN đều false (web đóng cửa):
  // true => vẫn hiện nút Tra cứu đơn hàng cho khách đã đặt trước đó
  SHOW_TRACKING_WHEN_CLOSED: false
};

// Lưu ý: chỉ bật MỘT chế độ tại một thời điểm.
// Nếu lỡ bật cả hai, web sẽ ưu tiên chế độ Order.
