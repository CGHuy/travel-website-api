const XLSX = require("xlsx");
const path = require("path");

const EXCEL_DIR = path.join(__dirname, "..", "excel");
const headers = ["TC", "Tên Dịch vụ", "Slug", "Mô tả", "Hoạt động", "Kết quả mong đợi", "Kết quả thực tế", "Pass/Fail"];
const colWidths = [{ wch: 14 }, { wch: 50 }, { wch: 50 }, { wch: 60 }, { wch: 12 }, { wch: 50 }, { wch: 50 }, { wch: 10 }];

function writeExcel(filename, rows) {
  const data = rows.map((r) => {
    while (r.length < 8) r.push("");
    return r;
  });
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  ws["!cols"] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Test Cases");
  XLSX.writeFile(wb, path.join(EXCEL_DIR, filename));
  console.log(`Created ${filename} with ${rows.length} test cases.`);
}

// ========== DECISION TABLE ==========
writeExcel("TC_DecisionTable.xlsx", [
  ["TC_SVC_01", "Tour ẩm thực đường phố", "tour-am-thuc-duong-pho",
    "Khám phá ẩm thực đường phố Sài Gòn với hơn 20 món ăn đặc sắc, kết hợp tham quan các địa danh nổi tiếng.",
    "Checked", "Thêm thành công, đóng modal, reload danh sách"],
  ["TC_SVC_02", "Dịch vụ massage spa", "xe-dua-don",
    "Gói massage thư giãn toàn thân 60 phút, liệu trình tinh dầu thiên nhiên.",
    "Checked", "Báo lỗi 'Slug đã tồn tại' + modal không đóng"],
  ["TC_SVC_03", "Ăn sáng", "buffet-sang", "", "Checked",
    "Báo lỗi 'Tên dịch vụ đã tồn tại' + modal không đóng"],
  ["TC_SVC_04", "", "", "", "Unchecked",
    "Tô đỏ viền Tên DV + Slug + 'Vui lòng nhập tên dịch vụ' + 'Vui lòng nhập slug'"],
  ["TC_SVC_05", "Dịch vụ giặt ủi", "",
    "Giặt sấy khô nhanh trong 2 giờ, nhận giao tận phòng, hỗ trợ giặt hấp vest và váy dạ hội.",
    "Checked", "Tô đỏ viền Slug + 'Vui lòng nhập slug'"],
  ["TC_SVC_06", "12345", "so-moi", "", "Checked",
    "Tô đỏ viền Tên DV + 'Tên DV không được chỉ chứa số'"],
  ["TC_SVC_07", "Ăn tối", "12345", "", "Checked",
    "Tô đỏ viền Slug + 'Slug không được chỉ chứa số'"],
]);

// ========== BVA ==========
writeExcel("TC_BVA.xlsx", [
  // Tên Dịch vụ BVA
  ["TC_SVC_08", "", "dich-vu-06", "Giới thiệu dịch vụ 06", "Checked",
    "Tô đỏ Tên DV + 'Vui lòng nhập tên dịch vụ.' Modal không đóng"],
  ["TC_SVC_09", "X", "x", "Giới thiệu dịch vụ 07", "Checked",
    "Thêm thành công, đóng modal, reload"],
  ["TC_SVC_10", "Vé", "ve", "Giới thiệu dịch vụ 08", "Checked",
    "Thêm thành công, đóng modal, reload"],
  ["TC_SVC_11",
    "Combo du lịch Đà Nẵng 3N2Đ trọn gói: khách sạn 4 sao trung tâm, xe đưa đón sân bay, buffet sáng, vé tham quan Bà Nà Hills và Hội An, hướng dẫn viên tiếng Việt chuyên nghiệp suốt chuyến đi.",
    "Combo-Da-Nang", "Giới thiệu Combo Đà Nẵng", "Checked",
    "Thêm thành công, đóng modal, reload"],
  ["TC_SVC_12",
    "Combo du lịch Nha Trang 4N3Đ trọn gói: resort 5 sao ven biển trung tâm, xe đưa đón sân bay Cam Ranh, ăn sáng và trưa hàng ngày, vé VinWonders và lặn biển ngắm san hô, hướng dẫn viên giàu kinh nghiệm.",
    "Combo-Nha-Trang", "Giới thiệu Combo Nha Trang", "Checked",
    "Thêm thành công, đóng modal, reload"],
  ["TC_SVC_13",
    "Combo du lịch Phú Quốc 5N4Đ trọn gói: resort cao cấp ven biển Bãi Trường, xe đưa đón sân bay quốc tế, buffet sáng và BBQ hải sản tối, vé Grand World và cáp treo Hòn Thơm, lặn ngắm san hô, hướng dẫn viên.",
    "Combo-Phu-Quoc", "Giới thiệu Combo Phu-Quoc", "Checked",
    "Giao diện chặn không cho nhập quá 200 ký tự (do maxlength)"],
  // Slug BVA
  ["TC_SVC_14", "Thuê xe máy", "", "Cho thuê xe máy Honda Vision đời mới, xăng đầy bìn", "Checked",
    "Tô đỏ Slug + 'Vui lòng nhập slug.' Modal không đóng"],
  ["TC_SVC_15", "Thuê xe đạp", "z", "Cho thuê xe đạp thể thao Giant đường kính 26 inch,", "Checked",
    "Thêm thành công, đóng modal, reload"],
  ["TC_SVC_16", "Đặt phòng khách sạn", "ab", "Dịch vụ đặt phòng khách sạn 3-5 sao tại trung tâm ", "Checked",
    "Thêm thành công, đóng modal, reload"],
  ["TC_SVC_17", "Đặt phòng resort", "dich-vu-dat-phong-khach-san-tai-da-nang-va-hoi-an",
    "Đặt phòng resort nghỉ dưỡng ven biển Đà Nẵng, bao ", "Checked",
    "Thêm thành công, đóng modal, reload"],
  ["TC_SVC_18", "Đặt phòng homestay", "dat-phong-khach-san-tai-da-nang-va-hoi-an-pho-co-1",
    "Đặt phòng homestay nguyên căn tại trung tâm phố cổ", "Checked",
    "Thêm thành công, đóng modal, reload"],
  ["TC_SVC_19", "Đặt phòng nghỉ dưỡng", "dich-vu-thue-xe-tu-lai-tai-da-nang-hoi-an-pho-co-12",
    "Dịch vụ đặt phòng nghỉ dưỡng cao cấp ven biển, spa", "Checked",
    "Giao diện chặn không cho nhập quá 50 ký tự (do maxlength)"],
  // Mô tả BVA
  ["TC_SVC_20", "Đặt phòng khách sạn 3 sao", "dat-phong-khach-san", "", "Checked",
    "Thêm thành công, đóng modal, reload"],
  ["TC_SVC_21", "Vé tham quan Đà Lạt", "ve-tham-quan-da-lat", "T (1 ký tự)", "Checked",
    "Thêm thành công, đóng modal, reload"],
  ["TC_SVC_22", "Hỗ trợ đặt phòng", "ho-tro-dat-phong",
    "Dịch vụ hỗ trợ đặt phòng khách sạn nghỉ dưỡng cao ", "Checked",
    "Thêm thành công, đóng modal, reload"],
  ["TC_SVC_23", "Xe du lịch miền Tây", "xe-du-lich-mien-tay",
    "Xe du lịch đưa đón khám phá miền Tây sông nước 3 n", "Checked",
    "Thêm thành công, đóng modal, reload"],
  ["TC_SVC_24", "Combo tham quan Đà Lạt", "combo-tham-quan-da-lat",
    "Combo dịch vụ tham quan Đà Lạt 4 ngày 3 đêm trọn gói bao gồm khách sạn trung tâm, xe đưa đón sân bay Liên Khương, ăn sáng buffet hàng ngày, vé tham quan các điểm nổi tiếng như Hồ Xuân Hương, Thung Lũng Tình Yêu, Đồi Cù, vườn hoa thành phố, thác Prenn, thiền viện Trúc Lâm, cáp treo Đà Lạt, dinh Bảo Đại, chợ Đà Lạt, và nhiều địa danh hấp dẫn khác. Đặc biệt, chương trình còn bao gồm bữa tối đặc sản địa phương với các món như bánh căn, bánh ướt lòng gà, lẩu gà lá é, cơm lam, gà nướng, rượu cần, và các loại trái cây đặc sản vùng cao nguyên. Du khách sẽ được trải nghiệm văn hóa, con người Đà Lạt với các hoạt động tham quan làng hoa, làng cà phê, vườn dâu tây, và các điểm check-in sống ảo nổi tiếng. Chương trình phù hợp cho gia đình, cặp đôi, nhóm bạn và các công ty tổ chức teambuilding. Giá trọn gói ưu đãi chỉ từ 2.990.000đ/người.", "Checked",
    "Giao diện chặn không cho nhập quá 300 ký tự (do maxlength)"],
]);
