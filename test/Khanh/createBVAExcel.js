const XLSX = require("xlsx");
const path = require("path");

const EXCEL_DIR = path.join(__dirname, "excel");

const EXCEL_HEADERS = ["TC", "ID Tour", "Ngày KH", "Địa điểm KH", "Giá NL", "Giá TE", "Tổng số chỗ", "Kết quả mong đợi"];
const EXCEL_COLS = [{ wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 60 }];

const testCases = [
  // ========== Giá vé người lớn (0 - 5.000.000) ==========
  // Các TC lỗi (01, 06) giữ nguyên date vì không submit server
  ["BVA-PR-01", "5", "28/07/2026", "Hà Nội", "-1", "1000000", "40",
    "'Nhập giá vé người lớn không hợp lệ, chỉ được nhập số'"],
  ["BVA-PR-02", "5", "28/07/2026", "Hà Nội", "0", "1000000", "40",
    "'Thêm điểm khởi hành thành công'"],
  ["BVA-PR-03", "5", "29/07/2026", "Hà Nội", "1", "1000000", "40",
    "'Thêm điểm khởi hành thành công'"],
  ["BVA-PR-04", "5", "30/07/2026", "Hà Nội", "4999999", "1000000", "40",
    "'Thêm điểm khởi hành thành công'"],
  ["BVA-PR-05", "5", "31/07/2026", "Hà Nội", "5000000", "1000000", "40",
    "'Thêm điểm khởi hành thành công'"],
  ["BVA-PR-06", "5", "28/07/2026", "Hà Nội", "5000001", "1000000", "40",
    "'Nhập giá vé người lớn không được vượt quá 5.000.000'"],

  // ========== Giá vé trẻ em (0 - 5.000.000) ==========
  // Các TC lỗi (01, 06) giữ nguyên date vì không submit server
  ["BVA-PC-01", "5", "28/07/2026", "Hà Nội", "1500000", "-1", "40",
    "'Nhập giá vé trẻ em không hợp lệ, chỉ được nhập số'"],
  ["BVA-PC-02", "5", "01/08/2026", "Hà Nội", "1500000", "0", "40",
    "'Thêm điểm khởi hành thành công'"],
  ["BVA-PC-03", "5", "02/08/2026", "Hà Nội", "1500000", "1", "40",
    "'Thêm điểm khởi hành thành công'"],
  ["BVA-PC-04", "5", "03/08/2026", "Hà Nội", "1500000", "4999999", "40",
    "'Thêm điểm khởi hành thành công'"],
  ["BVA-PC-05", "5", "04/08/2026", "Hà Nội", "1500000", "5000000", "40",
    "'Thêm điểm khởi hành thành công'"],
  ["BVA-PC-06", "5", "28/07/2026", "Hà Nội", "1500000", "5000001", "40",
    "'Nhập giá vé trẻ em không được vượt quá 5.000.000'"],

  // ========== Tổng số chỗ (1 - 100) ==========
  // Các TC lỗi (01, 06) giữ nguyên date vì không submit server
  ["BVA-SE-01", "5", "28/07/2026", "Hà Nội", "1500000", "1000000", "0",
    "'Tổng số chỗ phải lớn hơn 0'"],
  ["BVA-SE-02", "5", "05/08/2026", "Hà Nội", "1500000", "1000000", "1",
    "'Thêm điểm khởi hành thành công'"],
  ["BVA-SE-03", "5", "06/08/2026", "Hà Nội", "1500000", "1000000", "2",
    "'Thêm điểm khởi hành thành công'"],
  ["BVA-SE-04", "5", "07/08/2026", "Hà Nội", "1500000", "1000000", "99",
    "'Thêm điểm khởi hành thành công'"],
  ["BVA-SE-05", "5", "08/08/2026", "Hà Nội", "1500000", "1000000", "100",
    "'Thêm điểm khởi hành thành công'"],
  ["BVA-SE-06", "5", "28/07/2026", "Hà Nội", "1500000", "1000000", "101",
    "'Nhập tổng số chỗ không được vượt quá 100'"],
];

function createExcel(filename, data) {
  const ws = XLSX.utils.aoa_to_sheet([EXCEL_HEADERS, ...data]);
  ws["!cols"] = EXCEL_COLS;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Test Cases");
  XLSX.writeFile(wb, path.join(EXCEL_DIR, filename));
  console.log(`Created: ${filename}`);
}

createExcel("TC_Departure_BVA.xlsx", testCases);
