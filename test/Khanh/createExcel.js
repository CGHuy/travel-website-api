const XLSX = require("xlsx");
const path = require("path");

const EXCEL_DIR = path.join(__dirname, "excel");

const EXCEL_HEADERS = ["TC", "ID Tour", "Ngày KH", "Địa điểm KH", "Giá NL", "Giá TE", "Tổng số chỗ", "Kết quả mong đợi"];
const EXCEL_COLS = [{ wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 60 }];

const testCases = [
  ["TC01", "5", "28/07/2026", "Hà Nội", "1500000", "1000000", "40", "'Thêm điểm khởi hành thành công'"],
  ["TC02", "", "28/07/2026", "Hà Nội", "1500000", "1000000", "40", "'Vui lòng chọn Tour'"],
  ["TC03", "5", "", "Hà Nội", "1500000", "1000000", "40", "'Vui lòng chọn ngày khởi hành'"],
  ["TC04", "5", "28/07/2026", "", "1500000", "1000000", "40", "'Vui lòng chọn địa điểm khởi hành'"],
  ["TC05", "5", "28/07/2026", "Hà Nội", "1a500", "1000000", "40", "'Nhập giá vé người lớn không hợp lệ, chỉ được nhập số'"],
  ["TC06", "5", "28/07/2026", "Hà Nội", "15#$00", "1000000", "40", "'Nhập giá vé người lớn không hợp lệ, chỉ được nhập số'"],
  ["TC07", "5", "28/07/2026", "Hà Nội", "6000000", "1000000", "40", "'Nhập giá vé người lớn không được vượt quá 5.000.000'"],
  ["TC08", "5", "28/07/2026", "Hà Nội", "", "1000000", "40", "'Vui lòng nhập giá vé người lớn'"],
  ["TC09", "5", "28/07/2026", "Hà Nội", "1500000", "10a00", "40", "'Nhập giá vé trẻ em không hợp lệ, chỉ được nhập số'"],
  ["TC10", "5", "28/07/2026", "Hà Nội", "1500000", "10@0$", "40", "'Nhập giá vé trẻ em không hợp lệ, chỉ được nhập số'"],
  ["TC11", "5", "28/07/2026", "Hà Nội", "1500000", "6000000", "40", "'Nhập giá vé trẻ em không được vượt quá 5.000.000'"],
  ["TC12", "5", "28/07/2026", "Hà Nội", "1500000", "", "40", "'Vui lòng nhập giá vé trẻ em'"],
  ["TC13", "5", "28/07/2026", "Hà Nội", "1500000", "1000000", "4a", "'Nhập tổng số chỗ không hợp lệ, chỉ được nhập số'"],
  ["TC14", "5", "28/07/2026", "Hà Nội", "1500000", "1000000", "1$0", "'Nhập tổng số chỗ không hợp lệ, chỉ được nhập số'"],
  ["TC15", "5", "28/07/2026", "Hà Nội", "1500000", "1000000", "150", "'Nhập tổng số chỗ không được vượt quá 100'"],
  ["TC16", "5", "28/07/2026", "Hà Nội", "1500000", "1000000", "", "'Vui lòng nhập tổng số chỗ'"],
];

function createExcel(filename, data) {
  const ws = XLSX.utils.aoa_to_sheet([EXCEL_HEADERS, ...data]);
  ws["!cols"] = EXCEL_COLS;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Test Cases");
  XLSX.writeFile(wb, path.join(EXCEL_DIR, filename));
  console.log(`Created: ${filename}`);
}

createExcel("TC_Departure_DecisionTable.xlsx", testCases);
