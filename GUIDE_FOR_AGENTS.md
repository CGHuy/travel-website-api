# Hướng dẫn tạo Test cho Agent khác

## 1. Tổng quan

Dự án test tự động cho trang **Quản lý Tour Du lịch** sử dụng **Puppeteer** + **xlsx** để chạy Decision Table và BVA.

Mỗi thành viên có thư mục riêng trong `test/`:
```
test/
├── HA/              # Tests của Hà (Service - Thêm dịch vụ)
│   ├── shared.js
│   ├── runDecisionTable.js
│   ├── runBVA.js
│   ├── createExcel.js
│   ├── excel/
│   └── screenshots/
├── Khanh/           # Tests của Khanh (Departure - Thêm điểm khởi hành)
│   ├── shared.js
│   ├── runDecisionTable.js
│   ├── createExcel.js
│   ├── excel/
│   └── screenshots/
└── GUIDE_FOR_AGENTS.md   # File này
```

## 2. Kiến trúc test

### 2.1. Luồng chạy test

1. **`createExcel.js`** — Định nghĩa test cases và ghi vào file Excel
2. **`npm run <member>:<type>`** — Chạy script trong `package.json`
3. **`runDecisionTable.js`** (hoặc `runBVA.js`) — Entry point, gọi `runAllTests()`
4. **`shared.js`** — Core: login, navigate, set field, assert, ghi kết quả Excel

### 2.2. Chu kỳ mỗi test case

1. **Restore DB** từ `db_vietravel_KTPM.sql` (chạy 1 lần đầu)
2. **Login** với `tour-staff@gmail.com / 123456`
3. **Navigate** đến trang feature cần test
4. **Click mở modal** thêm mới
5. **Set fields** dựa vào data từ Excel
6. **Click submit**
7. **Chụp screenshot** kết quả
8. **Assert** (PASS nếu đúng expected)
9. **Ghi kết quả** vào Excel ngay sau mỗi TC

## 3. Quy tắc chung

### 3.1. Quy ước đặt tên
- **NPM script**: `<tên thành viên viết thường>:<loại test>` (VD: `Khanh:decision`, `HA:bva`)
- **Thư mục**: `test/<Tên thành viên>/`
- **Screenshot**: `test/<Tên thành viên>/screenshots/<Loại test>/<TC_ID>_result.png`
- **Excel**: `test/<Tên thành viên>/excel/TC_<Feature>_<Loại test>.xlsx`

### 3.2. Xử lý DB
- File backup: `db_vietravel_KTPM.sql`
- MySQL: host=localhost, user=root, password=root123, database=db_viet_tour, port=3306
- MySQL path: `C:\Program Files\MySQL\MySQL Server 9.6\bin\mysql.exe`
- Test script chạy `restoreDB()` một lần trước khi bắt đầu

### 3.3. Xử lý field đặc biệt

#### 3.3.1. Tour Combobox (ID Tour)
- Field `#addTourId` là `<input type="text">` với `dataset.tourId` chứa ID thực
- **Phải dùng `setAttribute("data-tour-id", id)`**, không dùng `dataset.tourId` (tránh xung đột event listener)
- Format hiển thị: `"{id} - {Tên tour}"` (VD: `"5 - Tour Phú Quốc 4N3Đ"`)
- Code mẫu:
```js
input.value = `${tourId} - Tour Phú Quốc 4N3Đ`;
input.setAttribute("data-tour-id", tourId);
```

#### 3.3.2. Date Picker
- Có hidden `#addDepartureDatePicker` (type=date) + visible `#addDepartureDate` (readonly)
- **Set hidden picker** rồi dispatch `change` → tự động format ra display field
- Code mẫu:
```js
const picker = document.getElementById("addDepartureDatePicker");
picker.value = "2026-07-28";
picker.dispatchEvent(new Event("change", { bubbles: true }));
```

#### 3.3.3. Number fields (Giá vé, Tổng số chỗ)
- Là `<input type="number">` — **không thể set non-digit value trực tiếp**
- Nếu value chứa chữ/ký tự đặc biệt → đổi tạm `type="text"` trước khi set:
```js
if (isDigitsOnly) {
  el.value = value;
} else {
  el.type = "text";      // Đổi tạm thành text để set được value
  el.value = value;
  el.dataset.sanitized = "1";  // Báo frontend là có ký tự lạ
}
el.dispatchEvent(new Event("input", { bubbles: true }));
```

#### 3.3.4. Select dropdown (Địa điểm)
- Set `value` + dispatch `change`

#### 3.3.5. Để trống field
- Không set gì cả (field mặc định rỗng khi modal mở)

## 4. PASS / FAIL logic

```js
if (expectedStr.includes("thành công")) {
  pass = !modalVisible;  // Modal đã đóng = thành công
} else {
  // Error cases: check field error messages
  const expectedPhrases = expectedStr.match(/'([^']+)'/g)
    ?.map(p => p.replace(/'/g, "")) || [];
  pass = expectedPhrases.some(phrase =>
    state.errors.some(err => err.includes(phrase))
  );
}
```

## 5. Format Excel

**Headers** (tuỳ feature):
```js
["TC", "ID Tour", "Ngày KH", "Địa điểm KH", "Giá NL", "Giá TE", "Tổng số chỗ",
 "Kết quả mong đợi", "Kết quả thực tế", "Pass/Fail"]
```

**Expected result format**:
- Thành công: `'Thêm ... thành công'`
- Lỗi: `'Nội dung lỗi chính xác'` (trong dấu single quote)

**Ghi kết quả**: Ghi incremental sau mỗi TC (dùng `writeExcel`), tránh mất data nếu crash.

## 6. Các bước tạo test cho member mới

### Bước 1: Tạo cấu trúc thư mục
```
test/<Member>/
├── createExcel.js
├── shared.js
├── runDecisionTable.js
├── excel/
└── screenshots/<Loại test>/
```

### Bước 2: Viết `createExcel.js`
- Định nghĩa mảng `testCases` với 2D array
- Mỗi row: `[TC_ID, field1, field2, ..., expected]`
- Gọi `createExcel(filename, data)` ở cuối

### Bước 3: Viết `shared.js`
- Copy từ member trước (`test/Khanh/shared.js`) và sửa:
  - `navigateToXxx()`: điều hướng đến trang feature
  - `setXxxField()`: các hàm set field tương ứng
  - `runSingleTest()`: logic assert theo feature
- Giữ nguyên: `login()`, `restoreDB()`, `readExcel()`, `writeExcel()`, `screenshot()`

### Bước 4: Viết `runDecisionTable.js`
```js
const { runAllTests } = require("./shared");
runAllTests("TC_Feature_DecisionTable.xlsx", "DecisionTable");
```

### Bước 5: Thêm script vào `package.json`
```json
"Member:decision": "node test/Member/runDecisionTable.js"
```

### Bước 6: Chạy và verify
```bash
npm run Member:decision
```

## 7. Lưu ý quan trọng

1. **`type="number"` không thể hiển thị chữ**: Luôn dùng trick đổi `type="text"` trước khi set value đặc biệt
2. **Tour combobox**: Set `dataset.tourId` bằng `setAttribute`, KHÔNG dispatch `input` (gây lỗi mất dataset)
3. **Date picker**: Chỉ cần set hidden `Picker` + dispatch `change` — display field tự cập nhật
4. **DB restore**: Luôn chạy restoreDB() trước khi test để đảm bảo data sạch
5. **Screenshot**: Chụp sau khi click submit + chờ animation (sleep 1.5s)
6. **Excel**: Ghi kết quả sau mỗi TC (incremental), không đợi đến cuối
7. **Biến `screenshotFile`**: Khai báo OUTSIDE try block để tránh lỗi scoping
8. **Field mặc định rỗng**: Modal mới mở có tất cả field rỗng — nếu TC cần field trống thì không set

## 8. Credentials

- **Admin login**: `tour-staff@gmail.com` / `123456`
- **Base URL**: `http://localhost:3000`
- **API endpoints**: Token lưu trong localStorage key `"token"`

## 9. Các page hiện có

| Feature | Dashboard page | Modal ID | Submit button |
|---|---|---|---|
| Service | `dashboard.html?page=service` | `#addServiceModal` | `#service-form` (submit event) |
| Departure | `dashboard.html?page=departure` | `#addDepartureModal` | `#saveAddDepartureBtn` (click) |

## 10. Các thành viên hiện tại

| Member | Feature | Script | File Excel |
|---|---|---|---|
| HA | Service (Thêm dịch vụ) | `HA:decision`, `HA:bva` | `TC_DecisionTable.xlsx`, `TC_BVA.xlsx` |
| Khanh | Departure (Thêm điểm khởi hành) | `Khanh:decision` | `TC_Departure_DecisionTable.xlsx` |
