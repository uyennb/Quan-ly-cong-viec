# TaskFlow VN - Ứng dụng Quản lý công việc & Dự án

Ứng dụng quản lý công việc và dự án chạy hoàn toàn ở phía client (không cần cơ sở dữ liệu backend, lưu trữ dữ liệu trực tiếp trong `localStorage`). Ứng dụng hỗ trợ quản lý dự án, quản lý thành viên, ma trận Eisenhower (Quan trọng - Khẩn cấp), xem công việc dạng danh sách và bảng Kanban, kéo thả sắp xếp thứ tự, và chế độ Sáng/Tối với giao diện hiện đại, tinh tế.

## 🌟 Tính năng nổi bật

- **Quản lý Dự án & Phân loại Ma trận Eisenhower**:
  - Phân chia các dự án vào 4 góc ma trận (Khẩn cấp & Quan trọng, Quan trọng - Không khẩn cấp, Khẩn cấp - Không quan trọng, Không khẩn cấp & Không quan trọng).
  - Kéo thả các dự án giữa các ô ma trận để thay đổi phân loại ưu tiên một cách trực quan.
- **Xem công việc dạng Kanban và Danh sách**:
  - **Bảng Kanban**: Kéo thả công việc giữa các cột (Chưa thực hiện, Đang làm, Hoàn thành) để cập nhật trạng thái nhanh chóng.
  - **Danh sách (List)**: Sắp xếp thứ tự ưu tiên của các công việc bằng cách kéo thả hàng dọc.
- **Quản lý Thành viên**:
  - Thêm, sửa, xóa thành viên đội ngũ với tên, vai trò và màu sắc avatar đặc trưng.
  - Phân quyền gán thành viên vào dự án và giao công việc trực quan.
- **Chế độ Sáng - Tối (Light/Dark Theme)**:
  - Chuyển đổi chủ đề mượt mà, lưu trạng thái lựa chọn trong trình duyệt.
- **Tối ưu Mobile (Responsive)**:
  - Trên thiết bị di động, sidebar điều hướng tự động thu gọn thành thanh Bottom Menu (điều hướng dưới), tối ưu không gian hiển thị và thao tác ngón cái.
- **Không cần cơ sở dữ liệu**:
  - Dữ liệu được lưu trữ tự động trong `localStorage` của trình duyệt, tải nhanh tức thì, bảo mật dữ liệu cục bộ.

## 🛠️ Công nghệ sử dụng

- **Core**: HTML5, Vanilla JavaScript (ES6 Modules)
- **Styling**: Vanilla CSS (CSS Variables, Flexbox, CSS Grid)
- **Kéo thả**: Pointer Events API (hỗ trợ cả Chuột máy tính và Màn hình cảm ứng di động)

## 📁 Cấu trúc thư mục

```text
├── index.html       # Khung giao diện chính và biểu mẫu modal
├── style.css        # Hệ thống style, responsive và hiệu ứng sáng/tối
├── state.js         # Quản lý trạng thái và lưu trữ localStorage
├── dragdrop.js      # Xử lý kéo thả bằng Pointer Events
└── app.js           # Điều hướng màn hình và kết nối UI với State
```

## 🚀 Hướng dẫn chạy dự án

### Cách 1: Chạy trực tiếp (Không cần cài đặt)
Bạn chỉ cần mở trực tiếp file `index.html` bằng bất kỳ trình duyệt web hiện đại nào (Chrome, Safari, Firefox, Edge).

### Cách 2: Sử dụng máy chủ cục bộ (Local Server)
Nếu bạn có Python 3 cài đặt trên máy, hãy mở Terminal tại thư mục dự án và chạy lệnh:

```bash
python3 -m http.server 8083
```

Sau đó, truy cập địa chỉ: [http://localhost:8083/](http://localhost:8083/) để trải nghiệm.

## 📝 Đóng góp ý kiến

Mọi ý kiến đóng góp hoặc báo lỗi, vui lòng tạo Issue trên GitHub hoặc gửi Pull Request để hoàn thiện ứng dụng.
