USE db_viet_tour;

-- Xóa dữ liệu cũ để có thể chạy lại script nhiều lần
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE wishlist;
TRUNCATE TABLE reviews;
TRUNCATE TABLE passengers;
TRUNCATE TABLE bookings;
TRUNCATE TABLE tour_departures;
TRUNCATE TABLE tour_services;
TRUNCATE TABLE tour_itineraries;
TRUNCATE TABLE tour_images;
TRUNCATE TABLE services;
TRUNCATE TABLE tours;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- =========================
-- 1. USERS
-- =========================
INSERT INTO users (fullname, phone, address, email, password, role) VALUES
('Nguyễn Văn Hùng', '0987654321', '123 Lê Lợi, Quận 1, TP.HCM', 'admin@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'admin'),
('Trần Thị Mai', '0912345678', '456 Nguyễn Trãi, Thanh Xuân, Hà Nội', 'tour-staff@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'tour-staff'),
('Lê Quốc Bảo', '0934567890', '789 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM', 'booking-staff@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'booking-staff'),
('Phạm Minh Tuấn', '0978123456', '12 Trần Phú, Ngô Quyền, Hải Phòng', 'tuan@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Đỗ Thị Ngọc Anh', '0967123456', '88 Lý Thường Kiệt, TP. Đà Nẵng', 'ngocanh@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Võ Hoàng Nam', '0945123789', '234 Hùng Vương, TP. Cần Thơ', 'nam@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Bùi Thanh Trúc', '0923456789', '56 Phan Chu Trinh, TP. Huế', 'truc@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Nguyễn Thị Hồng Nhung', '0398765432', '101 Cách Mạng Tháng 8, Quận 3, TP.HCM', 'nhung@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer');



INSERT INTO tours 
(name, slug, description, location, region, duration, price_default, price_child, cover_image) 
VALUES

('Tour Đà Lạt 3N2Đ','tour-da-lat',
'Chương trình du lịch Đà Lạt 3 ngày 2 đêm là hành trình nghỉ dưỡng kết hợp tham quan dành cho du khách yêu thích khí hậu mát mẻ, thiên nhiên xanh và không gian yên bình. Ngay từ khi đặt chân đến Đà Lạt, du khách sẽ cảm nhận được không khí trong lành đặc trưng của vùng cao nguyên. Trong suốt hành trình, du khách sẽ được tham quan các địa danh nổi tiếng như hồ Xuân Hương – trái tim của thành phố, quảng trường Lâm Viên với biểu tượng nụ hoa Atiso độc đáo, thung lũng Tình Yêu lãng mạn và vườn hoa thành phố rực rỡ sắc màu. 
Ngày tiếp theo, hành trình đưa du khách khám phá đồi chè Cầu Đất – nơi có thể săn mây vào buổi sáng sớm, mang lại trải nghiệm vô cùng ấn tượng. Tiếp tục là thác Datanla, nơi du khách có thể trải nghiệm máng trượt hiện đại xuyên rừng đầy thú vị. Ngoài ra, chương trình còn bao gồm tham quan chùa Linh Phước với kiến trúc khảm sành đặc sắc, mang giá trị tâm linh sâu sắc.
Không chỉ dừng lại ở cảnh đẹp, du khách còn có cơ hội thưởng thức ẩm thực địa phương phong phú như bánh tráng nướng, lẩu gà lá é, sữa đậu nành nóng vào buổi tối tại chợ đêm Đà Lạt. Tour phù hợp cho cặp đôi, gia đình và nhóm bạn muốn nghỉ dưỡng, thư giãn và tận hưởng không gian yên tĩnh.',
'Đà Lạt','Miền Nam','3 ngày 2 đêm',3200000,2200000,
'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281041/travel-website/dalat.jpg'),

('Tour Đà Nẵng - Hội An - Bà Nà Hills 3N2Đ','tour-da-nang-hoi-an-ba-na',
'Tour Đà Nẵng - Hội An - Bà Nà Hills 3 ngày 2 đêm là hành trình kết hợp hoàn hảo giữa du lịch nghỉ dưỡng, khám phá văn hóa và trải nghiệm giải trí hiện đại. Tại Đà Nẵng, du khách sẽ được tham quan những công trình biểu tượng như cầu Rồng, cầu Tình Yêu và tận hưởng bãi biển Mỹ Khê – một trong những bãi biển đẹp nhất hành tinh.
Điểm nhấn đặc biệt của tour là chuyến tham quan Bà Nà Hills, nơi du khách sẽ được trải nghiệm hệ thống cáp treo đạt nhiều kỷ lục thế giới, check-in Cầu Vàng nổi tiếng với kiến trúc độc đáo, tham quan làng Pháp cổ kính và tham gia các trò chơi tại Fantasy Park.
Hành trình tiếp tục với phố cổ Hội An – di sản văn hóa thế giới, nơi du khách sẽ được dạo bước trên những con phố đèn lồng lung linh, tham quan chùa Cầu, nhà cổ và thưởng thức các món đặc sản như cao lầu, mì Quảng. Tour phù hợp cho du khách muốn khám phá miền Trung một cách trọn vẹn trong thời gian ngắn.',
'Đà Nẵng - Hội An - Bà Nà Hills','Miền Trung','3 ngày 2 đêm',3000000,2000000,
'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281149/travel-website/hoian.png'),

('Tour Hà Nội - Hạ Long 2N1Đ','tour-ha-noi-ha-long',
'Chương trình du lịch Hà Nội - Hạ Long 2 ngày 1 đêm mang đến cho du khách cơ hội khám phá một trong những kỳ quan thiên nhiên thế giới được UNESCO công nhận. Khởi hành từ Hà Nội, du khách sẽ di chuyển bằng xe du lịch tiện nghi đến Hạ Long, chiêm ngưỡng phong cảnh thiên nhiên thay đổi từ đồng bằng đến vùng biển.
Tại Hạ Long, du khách sẽ lên du thuyền cao cấp, thưởng thức bữa trưa với các món hải sản tươi ngon trong khi tàu di chuyển qua hàng nghìn hòn đảo đá vôi kỳ vĩ. Hành trình bao gồm tham quan hang Sửng Sốt, chèo kayak hoặc đi thuyền nan khám phá hang Luồn và tắm biển tại đảo Titop.
Buổi tối, du khách có thể tham gia các hoạt động trên tàu như câu mực đêm, giao lưu hoặc thư giãn. Sáng hôm sau, du khách thức dậy sớm ngắm bình minh trên vịnh, tham gia lớp tập thể dục nhẹ trước khi quay về Hà Nội. Đây là tour phù hợp cho du khách yêu thích thiên nhiên và muốn trải nghiệm du thuyền.',
'Hà Nội - Hạ Long','Miền Bắc','2 ngày 1 đêm',2500000,1800000,
'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774280971/travel-website/halong.jpg'),

('Tour Nha Trang 4N3Đ','tour-nha-trang',
'Tour Nha Trang 4 ngày 3 đêm là hành trình nghỉ dưỡng biển cao cấp kết hợp vui chơi giải trí. Du khách sẽ được tận hưởng không khí trong lành, làn nước biển xanh trong và bãi cát trắng mịn. Chương trình bao gồm tham quan VinWonders với hàng loạt trò chơi hấp dẫn, công viên nước và thủy cung hiện đại.
Ngoài ra, du khách còn được tham gia tour đảo, trải nghiệm lặn biển ngắm san hô, câu cá và thưởng thức hải sản tươi sống ngay trên bè. Buổi tối là thời gian tự do khám phá chợ đêm Nha Trang và thưởng thức các món đặc sản địa phương.',
'Nha Trang','Miền Trung','4 ngày 3 đêm',4500000,3200000,
'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281066/travel-website/nhatrang.jpg'),

('Tour Phú Quốc 4N3Đ','tour-phu-quoc',
'Tour Phú Quốc 4 ngày 3 đêm đưa du khách đến với thiên đường nghỉ dưỡng biển đảo. Du khách sẽ được nghỉ tại resort cao cấp, tận hưởng không gian yên bình và dịch vụ chất lượng. Điểm nhấn của chương trình là trải nghiệm cáp treo vượt biển dài nhất thế giới đến Hòn Thơm.
Ngoài ra, du khách còn có cơ hội tham gia lặn biển ngắm san hô, tham quan làng chài, nhà thùng nước mắm và thưởng thức hải sản tươi ngon. Đây là tour lý tưởng cho gia đình và cặp đôi.',
'Phú Quốc','Miền Nam','4 ngày 3 đêm',5200000,3600000,
'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/phuquoc.png'),

('Tour Hà Nội - Sapa - Fansipan 3N2Đ','tour-ha-noi-sapa-fansipan',
'Tour Hà Nội - Sapa - Fansipan 3 ngày 2 đêm là hành trình khám phá vẻ đẹp hùng vĩ của núi rừng Tây Bắc. Du khách sẽ được chiêm ngưỡng ruộng bậc thang tuyệt đẹp, tham quan bản Cát Cát và tìm hiểu văn hóa dân tộc.
Điểm nổi bật là hành trình chinh phục đỉnh Fansipan bằng cáp treo hiện đại, nơi du khách có thể ngắm toàn cảnh núi rừng từ trên cao. Tour mang đến trải nghiệm thiên nhiên và văn hóa độc đáo.',
'Hà Nội - Sapa - Fansipan','Miền Bắc','3 ngày 2 đêm',3100000,2100000,
'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281088/travel-website/sapa.jpg'),

('Tour Huế - Động Phong Nha 3N2Đ','tour-hue-phong-nha',
'Tour Huế - Động Phong Nha 3 ngày 2 đêm kết hợp giữa khám phá di sản văn hóa và thiên nhiên. Du khách sẽ tham quan Đại Nội, chùa Thiên Mụ và các lăng tẩm vua Nguyễn.
Tiếp đó, hành trình đưa du khách đến Quảng Bình để khám phá động Phong Nha với hệ thống thạch nhũ kỳ ảo, được mệnh danh là một trong những hang động đẹp nhất thế giới.',
'Huế - Động Phong Nha','Miền Trung','3 ngày 2 đêm',2800000,1900000,
'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774280929/travel-website/hue.jpg'),

('Tour Ninh Bình - Tràng An - Tam Cốc 2N1Đ','tour-ninh-binh-trang-an-tam-coc',
'Tour Ninh Bình 2 ngày 1 đêm là hành trình khám phá vùng đất được ví như "Hạ Long trên cạn". Du khách sẽ được trải nghiệm ngồi thuyền tham quan Tràng An, chiêm ngưỡng hệ thống hang động và núi đá vôi hùng vĩ.
Ngoài ra, hành trình còn bao gồm tham quan Tam Cốc – Bích Động và chùa Bái Đính, nơi có nhiều kỷ lục về kiến trúc Phật giáo.',
'Ninh Bình - Tràng An - Tam Cốc','Miền Bắc','2 ngày 1 đêm',2200000,1500000,
'https://res.cloudinary.com/dtsroyjxz/image/upload/v1776238804/travel-website/ninhbinh.jpg');

-- ========================= -- 3. TOUR IMAGES (5/tour) -- =========================
INSERT INTO tour_images (tour_id, image) VALUES

-- Tour 1: Đà Lạt
(1,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281041/travel-website/dalat.jpg'),
(1,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281043/travel-website/dalat-2.jpg'),
(1,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281042/travel-website/dalat-3.jpg'),
(1,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281043/travel-website/dalat-4.jpg'),
(1,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281043/travel-website/dalat-5.jpg'),

-- Tour 2: Đà Nẵng - Hội An - Bà Nà (dùng bộ Hội An)
(2,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281149/travel-website/hoian.png'),
(2,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281150/travel-website/hoian-2.png'),
(2,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281150/travel-website/hoian-3.jpg'),
(2,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281151/travel-website/hoian-4.png'),
(2,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281153/travel-website/hoian-5.jpg'),

-- Tour 3: Hà Nội - Hạ Long
(3,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774280971/travel-website/halong.jpg'),
(3,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774280971/travel-website/halong-2.jpg'),
(3,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774280971/travel-website/halong-3.jpg'),
(3,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774280972/travel-website/halong-4.jpg'),
(3,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774280972/travel-website/halong-5.jpg'),

-- Tour 4: Nha Trang
(4,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281066/travel-website/nhatrang.jpg'),
(4,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281067/travel-website/nhatrang-2.jpg'),
(4,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281067/travel-website/nhatrang-3.jpg'),
(4,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281068/travel-website/nhatrang-4.jpg'),
(4,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281069/travel-website/nhatrang-5.jpg'),

-- Tour 5: Phú Quốc
(5,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/phuquoc.png'),
(5,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/phuquoc-2.png'),
(5,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/phuquoc-3.jpg'),
(5,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281353/travel-website/phuquoc-4.jpg'),
(5,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281353/travel-website/phuquoc-5.jpg'),

-- Tour 6: Sapa
(6,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281088/travel-website/sapa.jpg'),
(6,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281088/travel-website/sapa-2.jpg'),
(6,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281089/travel-website/sapa-3.jpg'),
(6,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281089/travel-website/sapa-4.jpg'),
(6,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281091/travel-website/sapa-5.jpg'),

-- Tour 7: Huế - Phong Nha
(7,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774280929/travel-website/hue.jpg'),
(7,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774280929/travel-website/hue-2.jpg'),
(7,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774280930/travel-website/hue-3.jpg'),
(7,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774280930/travel-website/hue-4.jpg'),
(7,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774280930/travel-website/hue-5.jpg'),

-- Tour 8: Ninh Bình
(8,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1776238804/travel-website/ninhbinh.jpg'),
(8,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281113/travel-website/ninhbinh-2.jpg'),
(8,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281114/travel-website/ninhbinh-3.jpg'),
(8,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281115/travel-website/ninhbinh-4.jpg'),
(8,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281116/travel-website/ninhbinh-5.jpg');

-- =========================
-- 4. ITINERARIES (THEO BẠN)
-- =========================
INSERT INTO tour_itineraries (tour_id, day_number, description) VALUES
(1,1,'CHÀO MỪNG ĐÀ LẠT – ĐÓN KHÁCH THAM QUAN
08:00: Xe và hướng dẫn viên đón quý khách tại sân bay/bến xe Đà Lạt, đưa về khách sạn làm thủ tục nhận phòng. Nghỉ ngơi.
14:00: Tham quan Hồ Xuân Hương – biểu tượng của thành phố, tiếp tục check-in tại Quảng trường Lâm Viên với công trình kiến trúc độc đáo.
16:00: Tham quan Thung lũng Tình Yêu và Vườn hoa Thành phố với hàng trăm loài hoa đặc trưng của Đà Lạt.
18:30: Dùng bữa tối tại nhà hàng. Sau đó tự do khám phá chợ đêm Đà Lạt, thưởng thức đặc sản địa phương.'),

(1,2,'ĐÀ LẠT – ĐỒI CHÈ – THÁC DATANLA (Ăn sáng, trưa)
05:30: Khởi hành đi Đồi chè Cầu Đất, săn mây và đón bình minh.
08:00: Dùng bữa sáng. Trở về trung tâm thành phố.
10:00: Tham quan Thác Datanla, trải nghiệm máng trượt xuyên rừng hiện đại.
14:00: Tham quan Chùa Linh Phước (Chùa Ve Chai) với kiến trúc khảm sành độc đáo.
Tối: Tự do nghỉ ngơi hoặc khám phá thành phố về đêm.'),

(1,3,'TẠM BIỆT ĐÀ LẠT – TIỄN KHÁCH
07:00: Dùng bữa sáng tại khách sạn.
08:30: Tham quan Chợ Đà Lạt, mua sắm đặc sản.
10:30: Làm thủ tục trả phòng, xe đưa quý khách ra sân bay/bến xe. Kết thúc chương trình.'),


-- ================= ĐÀ NẴNG - HỘI AN - BÀ NÀ =================
(2,1,'CHÀO MỪNG ĐÀ NẴNG – CITY TOUR
08:00: Xe đón quý khách tại sân bay Đà Nẵng, đưa về khách sạn nhận phòng nghỉ ngơi.
15:00: Tham quan Cầu Rồng, Cầu Tình Yêu, chụp hình check-in tại các điểm nổi bật của thành phố.
16:30: Tắm biển Mỹ Khê – một trong những bãi biển đẹp nhất hành tinh.
18:30: Dùng bữa tối tại nhà hàng. Sau đó tự do khám phá Đà Nẵng về đêm, dạo phố hoặc thưởng thức ẩm thực địa phương.'),

(2,2,'BÀ NÀ HILLS – CẦU VÀNG
07:30: Dùng bữa sáng tại khách sạn, khởi hành đi Bà Nà Hills.
09:00: Trải nghiệm hệ thống cáp treo đạt kỷ lục thế giới, tham quan Cầu Vàng nổi tiếng.
10:30: Tham quan vườn hoa Le Jardin, hầm rượu Debay và Làng Pháp.
12:00: Dùng bữa trưa buffet tại nhà hàng trên đỉnh Bà Nà.
14:00: Tham gia các trò chơi tại Fantasy Park.
16:30: Xuống cáp treo, trở về khách sạn nghỉ ngơi.
19:00: Tự do khám phá thành phố.'),

(2,3,'TẠM BIỆT ĐÀ NẴNG – TIỄN KHÁCH
07:30: Dùng bữa sáng, làm thủ tục trả phòng.
08:30: Di chuyển đến phố cổ Hội An.
09:30: Tham quan Chùa Cầu, nhà cổ Tấn Ký, hội quán Phúc Kiến.
11:30: Tự do mua sắm và thưởng thức ẩm thực.
13:30: Xe đưa quý khách ra sân bay. Kết thúc chương trình.'),


-- ================= HÀ NỘI - HẠ LONG =================
(3,1,'HÀ NỘI – HẠ LONG (Ăn trưa, tối)
07:30: Xe đón quý khách tại Hà Nội, khởi hành đi Hạ Long.
11:30: Đến cảng, làm thủ tục lên du thuyền, nhận phòng.
12:30: Dùng bữa trưa trên tàu với các món hải sản đặc trưng.
14:00: Tham quan Hang Sửng Sốt – hang động đẹp nhất vịnh Hạ Long.
15:30: Chèo kayak hoặc tham quan Hang Luồn.
16:30: Tắm biển và leo núi tại đảo Titop.
19:00: Dùng bữa tối trên tàu, tham gia câu mực đêm.'),

(3,2,'HẠ LONG – HÀ NỘI (Ăn sáng, trưa)
06:00: Ngắm bình minh, tập thể dục trên boong tàu.
07:00: Dùng bữa sáng nhẹ.
08:30: Tham quan thêm các điểm trên vịnh.
09:30: Trả phòng.
11:00: Dùng bữa trưa.
12:00: Quay về Hà Nội. Kết thúc tour.'),


-- ================= NHA TRANG =================
(4,1,'CHÀO MỪNG NHA TRANG – ĐÓN KHÁCH
09:00: Đón quý khách tại sân bay Cam Ranh, đưa về khách sạn nhận phòng.
15:00: Tự do tắm biển, tham quan quảng trường Nha Trang.
19:00: Dùng bữa tối, tự do khám phá chợ đêm.'),

(4,2,'VINWONDERS (Ăn sáng, trưa)
07:30: Dùng bữa sáng, khởi hành đi VinWonders.
09:00: Trải nghiệm cáp treo vượt biển.
10:00: Vui chơi tại công viên nước và khu trò chơi.
12:00: Ăn trưa.
14:00: Tiếp tục khám phá khu vui chơi.
17:00: Trở về khách sạn.'),

(4,3,'TOUR ĐẢO (Ăn sáng, trưa)
08:00: Khởi hành tham quan các đảo.
10:00: Lặn biển ngắm san hô.
12:00: Ăn trưa hải sản.
15:00: Trở về khách sạn nghỉ ngơi.'),

(4,4,'TIỄN KHÁCH (Ăn sáng)
07:00: Dùng bữa sáng.
09:00: Trả phòng, tiễn sân bay.'),


-- ================= PHÚ QUỐC =================
(5,1,'ĐÓN KHÁCH – KHÁM PHÁ PHÚ QUỐC (Ăn tối)
09:00: Xe và hướng dẫn viên đón quý khách tại sân bay Phú Quốc, đưa về khách sạn/resort làm thủ tục nhận phòng. Nghỉ ngơi, thư giãn sau chuyến bay.
15:00: Tự do tắm biển tại bãi biển riêng của resort, tận hưởng không gian trong lành và cảnh biển tuyệt đẹp của đảo ngọc.
16:30: Tham quan Dinh Cậu – địa điểm tâm linh nổi tiếng, ngắm hoàng hôn trên biển.
18:30: Dùng bữa tối tại nhà hàng với các món hải sản tươi sống.
20:00: Tự do khám phá chợ đêm Phú Quốc, thưởng thức đặc sản như hải sản nướng, kem cuộn, nước mắm Phú Quốc.'),

(5,2,'CÁP TREO HÒN THƠM – VUI CHƠI BIỂN (Ăn sáng, trưa)
07:00: Dùng bữa sáng tại khách sạn.
08:00: Xe đưa quý khách đến ga cáp treo An Thới.
08:30: Trải nghiệm tuyến cáp treo vượt biển dài nhất thế giới đến Hòn Thơm, ngắm toàn cảnh quần đảo An Thới từ trên cao.
09:30: Tự do tắm biển, vui chơi tại công viên nước Aquatopia Water Park với nhiều trò chơi hấp dẫn.
12:00: Dùng bữa trưa buffet tại nhà hàng trên đảo.
14:00: Tiếp tục tham gia các hoạt động giải trí, nghỉ ngơi.
16:00: Quay trở lại đất liền bằng cáp treo.
19:00: Tự do ăn tối và khám phá Phú Quốc về đêm.'),

(5,3,'KHÁM PHÁ NAM ĐẢO – LẶN BIỂN (Ăn sáng, trưa)
07:30: Dùng bữa sáng tại khách sạn.
08:30: Khởi hành tham quan Nam Đảo.
09:30: Tham quan cơ sở nuôi cấy ngọc trai, tìm hiểu quy trình sản xuất.
10:30: Di chuyển ra đảo, tham gia lặn biển ngắm san hô, trải nghiệm câu cá.
12:30: Dùng bữa trưa trên tàu hoặc tại nhà hàng với hải sản tươi sống.
14:30: Tham quan nhà thùng nước mắm Phú Quốc, tìm hiểu nghề truyền thống lâu đời.
16:00: Trở về khách sạn nghỉ ngơi.
18:30: Tự do ăn tối, khám phá chợ đêm hoặc dạo biển.'),

(5,4,'PHÚ QUỐC – TIỄN KHÁCH (Ăn sáng)
07:00: Dùng bữa sáng tại khách sạn.
08:00: Tự do nghỉ dưỡng, tắm biển hoặc mua sắm đặc sản.
10:00: Làm thủ tục trả phòng.
10:30: Xe đưa quý khách ra sân bay Phú Quốc, kết thúc chương trình.'),

-- ================= SAPA =================
(6,1,'HÀ NỘI – SAPA – BẢN CÁT CÁT (Ăn trưa, tối)
06:30: Xe và hướng dẫn viên đón quý khách tại điểm hẹn ở Hà Nội, khởi hành đi Sapa theo đường cao tốc Nội Bài – Lào Cai.
09:30: Dừng chân nghỉ ngơi tại trạm dừng, thư giãn và dùng nhẹ.
12:30: Đến Sapa, dùng bữa trưa tại nhà hàng địa phương với các món đặc sản vùng núi.
14:00: Nhận phòng khách sạn, nghỉ ngơi.
15:30: Khởi hành tham quan bản Cát Cát – nơi sinh sống của người H’Mông, tìm hiểu đời sống văn hóa, phong tục tập quán.
17:30: Trở về khách sạn nghỉ ngơi.
18:30: Dùng bữa tối tại nhà hàng.
19:00: Tự do khám phá thị trấn Sapa, tham quan nhà thờ đá, thưởng thức các món nướng đặc trưng vùng cao.'),

(6,2,'CHINH PHỤC FANSIPAN (Ăn sáng, trưa)
07:00: Dùng bữa sáng tại khách sạn.
08:00: Khởi hành đến ga cáp treo Fansipan.
08:30: Trải nghiệm tuyến cáp treo đạt kỷ lục thế giới, chinh phục đỉnh Fansipan – “Nóc nhà Đông Dương”.
10:30: Tham quan quần thể tâm linh trên đỉnh núi, chụp hình lưu niệm.
12:00: Trở xuống và dùng bữa trưa tại nhà hàng.
14:00: Tự do nghỉ ngơi hoặc khám phá Sapa như chợ Sapa, quảng trường trung tâm.
18:30: Dùng bữa tối tự túc, thưởng thức đặc sản địa phương.
19:00: Nghỉ đêm tại Sapa.'),

(6,3,'SAPA – HÀ NỘI (Ăn sáng)
07:00: Dùng bữa sáng tại khách sạn.
08:00: Tự do tham quan chợ Sapa, mua sắm đặc sản địa phương như thổ cẩm, nông sản.
10:00: Làm thủ tục trả phòng.
10:30: Khởi hành về Hà Nội.
13:30: Dừng chân nghỉ ngơi, ăn trưa tự túc trên đường.
16:30: Về đến Hà Nội, kết thúc chương trình.'),


-- ================= HUẾ =================
(7,1,'ĐÓN KHÁCH – THAM QUAN CỐ ĐÔ HUẾ (Ăn trưa, tối)
Sáng: Xe đón quý khách tại sân bay/ga Huế, đưa về trung tâm thành phố.
11:30: Dùng bữa trưa tại nhà hàng với các món đặc sản Huế.
13:30: Nhận phòng khách sạn nghỉ ngơi.
15:00: Tham quan Đại Nội Huế – Hoàng thành triều Nguyễn, tìm hiểu lịch sử và kiến trúc cung đình.
17:30: Trở về khách sạn nghỉ ngơi.
18:30: Dùng bữa tối.
Tối: Tự do dạo phố, thưởng thức ẩm thực Huế hoặc tham gia chương trình nghe ca Huế trên sông Hương.'),

(7,2,'HUẾ – PHONG NHA (Ăn sáng, trưa)
06:30: Dùng bữa sáng tại khách sạn.
07:30: Khởi hành đi Phong Nha – Kẻ Bàng.
11:30: Dùng bữa trưa tại nhà hàng địa phương.
13:00: Tham quan động Phong Nha bằng thuyền, chiêm ngưỡng hệ thống hang động kỳ vĩ.
16:30: Khởi hành về Huế.
19:30: Về đến Huế, nghỉ ngơi, ăn tối tự túc.'),

(7,3,'HUẾ – TIỄN KHÁCH (Ăn sáng)
07:00: Dùng bữa sáng tại khách sạn.
08:00: Tham quan Chùa Thiên Mụ – biểu tượng tâm linh của Huế.
09:30: Tham quan chợ Đông Ba, mua đặc sản.
11:00: Trả phòng khách sạn.
Xe đưa quý khách ra sân bay/ga Huế. Kết thúc chương trình.'),


-- ================= NINH BÌNH =================
(8,1,'HÀ NỘI – TRÀNG AN (Ăn trưa)
07:30: Xe đón quý khách tại Hà Nội, khởi hành đi Ninh Bình.
09:30: Đến Ninh Bình, nghỉ ngơi.
10:00: Tham quan khu du lịch Tràng An bằng thuyền, chiêm ngưỡng cảnh sắc non nước hữu tình.
12:30: Dùng bữa trưa tại nhà hàng với các món đặc sản như dê núi, cơm cháy.
14:00: Tham quan chùa Bái Đính – quần thể chùa lớn nhất Việt Nam.
17:00: Nhận phòng khách sạn, nghỉ ngơi.
18:30: Dùng bữa tối.
20:00: Tự do nghỉ ngơi hoặc khám phá Ninh Bình về đêm.'),

(8,2,'TAM CỐC – HÀ NỘI (Ăn sáng, trưa)
07:00: Dùng bữa sáng tại khách sạn.
08:00: Tham quan Tam Cốc – Bích Động bằng thuyền, khám phá hệ thống hang động tự nhiên.
11:30: Trả phòng khách sạn.
12:00: Dùng bữa trưa tại nhà hàng.
13:30: Khởi hành về Hà Nội.
16:00: Về đến Hà Nội, kết thúc chương trình.');

-- =========================
-- 5. DEPARTURES (mỗi tour nhiều lịch khởi hành)
-- =========================
INSERT INTO tour_departures 
(id,tour_id,departure_location,departure_date,price_moving,price_moving_child,seats_total,seats_available) VALUES

(1,1,'TP.HCM','2026-04-01',500000,300000,25,18),
(2,1,'TP.HCM','2026-04-15',500000,300000,25,20),

(3,2,'Đà Nẵng','2026-04-05',200000,100000,30,25),
(4,2,'Hà Nội','2026-04-20',600000,400000,30,27),

(5,3,'Hà Nội','2026-04-08',300000,150000,35,30),
(6,3,'Hà Nội','2026-04-22',300000,150000,35,33),

(7,4,'TP.HCM','2026-05-01',700000,400000,30,24),
(8,4,'Hà Nội','2026-05-10',1200000,800000,30,26),

(9,5,'TP.HCM','2026-05-05',800000,500000,30,0),
(10,5,'Hà Nội','2026-05-15',1500000,1000000,30,27),

(11,6,'Hà Nội','2026-05-10',400000,200000,25,20),
(12,6,'TP.HCM','2026-05-20',1200000,800000,25,22),

(13,7,'Huế','2026-04-12',200000,100000,25,20),
(14,7,'Đà Nẵng','2026-04-25',400000,200000,25,23),

(15,8,'Hà Nội','2026-04-18',150000,80000,30,27),
(16,8,'TP.HCM','2026-05-02',900000,600000,30,28);

Update tour_departures set status = 'full' where id in (9);
-- =========================
-- 6. SERVICES (mô tả chuyên nghiệp)
-- =========================
INSERT INTO services (id,name,slug,description) VALUES
(1,'Ăn sáng','an-sang',
'Bao gồm bữa sáng buffet tại khách sạn với đa dạng món ăn Á - Âu, đảm bảo dinh dưỡng và phù hợp khẩu vị nhiều đối tượng khách hàng.'),

(2,'Xe đưa đón','xe-dua-don',
'Xe du lịch đời mới, máy lạnh, đưa đón khách theo lịch trình, đảm bảo an toàn, đúng giờ và tiện nghi suốt hành trình.'),

(3,'Hướng dẫn viên','huong-dan-vien',
'Hướng dẫn viên chuyên nghiệp, am hiểu tuyến điểm, nhiệt tình hỗ trợ và cung cấp thông tin chi tiết trong suốt chuyến đi.'),

(4,'Vé tham quan','ve-tham-quan',
'Bao gồm toàn bộ vé tham quan các điểm trong chương trình, không phát sinh chi phí ngoài lịch trình đã công bố.'),

(5,'Bảo hiểm du lịch','bao-hiem',
'Bảo hiểm du lịch trọn gói, đảm bảo quyền lợi cho khách trong suốt thời gian tham gia tour.');


-- =========================
-- 7. TOUR SERVICES (phân bổ hợp lý)
-- =========================
INSERT INTO tour_services (tour_id,service_id) VALUES

(1,1),(1,2),(1,3),(1,4),(1,5),
(2,1),(2,2),(2,3),(2,4),
(3,1),(3,2),(3,3),(3,4),
(4,1),(4,2),(4,3),(4,4),(4,5),
(5,1),(5,2),(5,3),(5,4),(5,5),
(6,1),(6,2),(6,3),(6,4),
(7,1),(7,2),(7,3),(7,4),
(8,1),(8,2),(8,3),(8,4);


-- =========================
-- 8. BOOKINGS (logic giá chuẩn)
-- =========================
INSERT INTO bookings 
(user_id,departure_id,adults,children,total_price,payment_status,status,contact_name,contact_phone,contact_email) VALUES

(4,1,2,1, (2*3200000 + 1*2200000 + 2*500000 + 1*300000),'paid','confirmed','Phạm Minh Tuấn','0978123456','tuan@gmail.com'),

(5,3,1,1, (1*3000000 + 1*2000000 + 1*200000 + 1*100000),'paid','confirmed','Đỗ Thị Ngọc Anh','0967123456','ngocanh@gmail.com'),

(6,5,2,0, (2*2500000 + 2*300000),'paid','pending','Võ Hoàng Nam','0945123789','nam@gmail.com'),

(7,9,2,1, (2*5200000 + 1*3600000 + 2*800000 + 1*500000),'paid','confirmed','Bùi Thanh Trúc','0923456789','truc@gmail.com'),

(8,11,1,0, (1*3100000 + 1*400000),'paid','confirmed','Nguyễn Thị Hồng Nhung','0398765432','nhung@gmail.com');


INSERT INTO passengers (booking_id, fullname, gender, dob, passenger_type) VALUES
-- Booking ID 1: 2 người lớn, 1 trẻ em (Người đặt: Phạm Minh Tuấn)
(1, 'Phạm Minh Tuấn', 'Nam', '1990-05-15', 'adult'),
(1, 'Lê Thu Hương', 'Nữ', '1992-10-20', 'adult'),
(1, 'Phạm Minh Khang', 'Nam', '2018-03-12', 'child'),

-- Booking ID 2: 1 người lớn, 1 trẻ em (Người đặt: Đỗ Thị Ngọc Anh)
(2, 'Đỗ Thị Ngọc Anh', 'Nữ', '1995-08-25', 'adult'),
(2, 'Đỗ Gia Bảo', 'Nam', '2019-11-30', 'child'),

-- Booking ID 3: 2 người lớn, 0 trẻ em (Người đặt: Võ Hoàng Nam)
(3, 'Võ Hoàng Nam', 'Nam', '1988-12-05', 'adult'),
(3, 'Nguyễn Thùy Chi', 'Nữ', '1991-04-14', 'adult'),

-- Booking ID 4: 2 người lớn, 1 trẻ em (Người đặt: Bùi Thanh Trúc)
(4, 'Bùi Thanh Trúc', 'Nữ', '1993-02-28', 'adult'),
(4, 'Trần Văn Mạnh', 'Nam', '1990-07-19', 'adult'),
(4, 'Bùi Ngọc Diệp', 'Nữ', '2020-05-10', 'child'),

-- Booking ID 5: 1 người lớn, 0 trẻ em (Người đặt: Nguyễn Thị Hồng Nhung)
(5, 'Nguyễn Thị Hồng Nhung', 'Nữ', '1997-09-02', 'adult');

-- ==========================================================
-- BỔ SUNG DỮ LIỆU CÁC TOUR (TỪ 9 ĐẾN 18) VÀ DỮ LIỆU LIÊN QUAN
-- ==========================================================

-- 1. TOURS (9 - 18)
INSERT INTO tours (name, slug, description, location, region, duration, price_default, price_child, cover_image) VALUES
('Tour Côn Đảo 3N2Đ', 'tour-con-dao', 'Tour Côn Đảo 3 ngày 2 đêm đưa du khách về với hòn đảo thiêng liêng, nơi ghi dấu những trang sử hào hùng của dân tộc tại Nghĩa trang Hàng Dương. Bên cạnh đó, du khách còn được đắm mình trong làn nước xanh mát tại Bãi Đầm Trầu - một trong những bãi biển hoang sơ đẹp nhất tại đây, và trải nghiệm lặn ngắm san hô tuyệt đẹp.', 'Côn Đảo', 'Miền Nam', '3 ngày 2 đêm', 3500000, 2500000, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/condao.jpg'),
('Tour Mộc Châu 2N1Đ', 'tour-moc-chau', 'Khám phá cao nguyên Mộc Châu 2 ngày 1 đêm với khí hậu mát mẻ quanh năm. Điểm nhấn của hành trình là check-in tại những Đồi chè trái tim xanh mướt, chiêm ngưỡng vẻ đẹp thơ mộng của Thác Dải Yếm và đắm chìm trong sắc trắng tinh khôi của mùa hoa mận, hoa cải nở rộ khắp các bản làng Tây Bắc.', 'Mộc Châu', 'Miền Bắc', '2 ngày 1 đêm', 1800000, 1200000, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/mocchau.jpg'),
('Tour Quy Nhơn – Phú Yên 3N2Đ', 'tour-quy-nhon-phu-yen', 'Hành trình Quy Nhơn - Phú Yên 3 ngày 2 đêm đưa bạn đến với xứ sở "hoa vàng trên cỏ xanh". Tận mắt chiêm ngưỡng vẻ đẹp hùng vĩ của Eo Gió, tắm biển trong vắt tại Kỳ Co và ngỡ ngàng trước kiệt tác thiên nhiên Ghềnh Đá Đĩa. Đừng quên thưởng thức hải sản tươi sống vô cùng hấp dẫn của miền Trung nắng gió.', 'Quy Nhơn - Phú Yên', 'Miền Trung', '3 ngày 2 đêm', 3200000, 2200000, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/quynhon.jpg'),
('Tour Tây Ninh – Núi Bà Đen 1N', 'tour-tay-ninh', 'Hành trình hành hương ngắn ngày đến Tây Ninh, chinh phục "Nóc nhà Đông Nam Bộ" bằng hệ thống Cáp treo Núi Bà Đen hiện đại. Thăm viếng Chùa Bà linh thiêng, cầu bình an cho gia đình và tận hưởng không khí trong lành, ngoạn cảnh thiên nhiên từ trên cao. Một chuyến đi du lịch tâm linh kết hợp ngắm cảnh vô cùng ý nghĩa.', 'Tây Ninh', 'Miền Nam', '1 ngày', 600000, 400000, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1776238825/travel-website/tayninh.jpg'),
('Tour Cần Thơ – Miền Tây 2N1Đ', 'tour-can-tho', 'Xuôi về miền Tây sông nước 2 ngày 1 đêm, trải nghiệm nét văn hóa độc đáo tại Chợ nổi Cái Răng tấp nập thuyền bè lúc bình minh. Lênh đênh trên xuồng ba lá len lỏi qua các kênh rạch, ghé thăm Vườn trái cây trĩu quả, thưởng thức đặc sản đậm chất dân dã và lắng nghe đờn ca tài tử Nam Bộ ngọt ngào.', 'Cần Thơ', 'Miền Nam', '2 ngày 1 đêm', 1500000, 1000000, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1776238158/travel-website/cantho.jpg'),
('Tour Hà Giang 4N3Đ', 'tour-ha-giang', 'Chuyến đi 4 ngày 3 đêm khám phá Hà Giang - nơi địa đầu Tổ quốc. Chinh phục những cung đường uốn lượn ngoạn mục, chiêm ngưỡng sự hùng vĩ của Cao nguyên đá Đồng Văn và Đèo Mã Pí Lèng - một trong tứ đại đỉnh đèo. Quý khách còn được ngắm nhìn Ruộng bậc thang Hoàng Su Phì rực rỡ mùa lúa chín.', 'Hà Giang', 'Miền Bắc', '4 ngày 3 đêm', 3800000, 2800000, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/hagiang.jpg'),
('Tour Bình Ba – Cam Ranh 2N1Đ', 'tour-binh-ba', 'Trốn khỏi sự ồn ào của phố thị với Tour Bình Ba - Cam Ranh 2 ngày 1 đêm. Đảo Bình Ba nổi tiếng với Biển trong xanh, cát trắng mịn và tĩnh lặng. Đặc biệt, du khách sẽ được thưởng thức đặc sản Tôm hùm Bình Ba trứ danh, tham gia các hoạt động Lặn biển ngắm san hô rực rỡ màu sắc dưới đáy đại dương.', 'Bình Ba', 'Miền Trung', '2 ngày 1 đêm', 2200000, 1500000, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1776238854/travel-website/binhba-2.jpg'),
('Tour Thám Hiểm Sơn Đoòng 4N3Đ', 'tour-son-doong', 'Tour thám hiểm hang Sơn Đoòng 4 ngày 3 đêm mang đến trải nghiệm độc nhất vô nhị trên thế giới. Khám phá hang động lớn nhất hành tinh với hệ sinh thái kỳ diệu, rừng nguyên sinh ngay trong lòng hang và những khối thạch nhũ khổng lồ. Hành trình đòi hỏi thể lực tốt, dành cho những ai đam mê mạo hiểm và thiên nhiên.', 'Quảng Bình', 'Miền Trung', '4 ngày 3 đêm', 65000000, 65000000, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/sondoong.jpg'),
('Tour Vũng Tàu 2N1Đ', 'tour-vung-tau', 'Nạp năng lượng với chuyến du lịch biển gần TP.HCM tại Vũng Tàu 2 ngày 1 đêm. Hành trình đưa bạn tham quan bức Tượng Chúa Kitô cao nhất Việt Nam, chinh phục Hải đăng Vũng Tàu để ngắm toàn cảnh thành phố và thỏa sức tắm biển, thưởng thức hải sản tươi ngon.', 'Vũng Tàu', 'Miền Nam', '2 ngày 1 đêm', 1300000, 900000, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/vungtau.jpg'),
('Tour Pleiku – Gia Lai 3N2Đ', 'tour-gia-lai', 'Khám phá đại ngàn Tây Nguyên hùng vĩ với tour Pleiku - Gia Lai 3 ngày 2 đêm. Đôi mắt Pleiku - Biển Hồ T’Nưng xanh biếc, chiêm ngưỡng vẻ đẹp hoang sơ của Núi lửa Chư Đăng Ya mùa hoa dã quỳ và đắm mình trong không gian Văn hóa Tây Nguyên đậm đà bản sắc cùng tiếng cồng chiêng vang vọng.', 'Gia Lai', 'Tây Nguyên', '3 ngày 2 đêm', 2800000, 1900000, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/gialai.jpg');

-- 2. TOUR IMAGES
INSERT INTO tour_images (tour_id, image) VALUES
-- Tour 9: Côn Đảo
(9, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/condao.jpg'),
(9, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/condao-2.jpg'),
(9, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/condao-3.jpg'),
(9, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/condao-4.jpg'),
(9, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/condao-5.jpg'),

-- Tour 10: Mộc Châu
(10, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/mocchau.jpg'),
(10, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/mocchau-2.jpg'),
(10, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/mocchau-3.jpg'),
(10, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/mocchau-4.jpg'),
(10, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/mocchau-5.jpg'),

-- Tour 11: Quy Nhơn - Phú Yên
(11, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/quynhon.jpg'),
(11, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/quynhon-2.jpg'),
(11, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/quynhon-3.jpg'),
(11, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/quynhon-4.jpg'),
(11, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/quynhon-5.jpg'),

-- Tour 12: Tây Ninh
(12, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1776238825/travel-website/tayninh.jpg'),
(12, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/tayninh-2.jpg'),
(12, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/tayninh-3.jpg'),
(12, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/tayninh-4.jpg'),
(12, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/tayninh-5.jpg'),

-- Tour 13: Cần Thơ
(13, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1776238158/travel-website/cantho.jpg'),
(13, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/cantho-2.jpg'),
(13, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/cantho-3.jpg'),
(13, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/cantho-4.jpg'),
(13, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/cantho-5.jpg'),

-- Tour 14: Hà Giang
(14, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/hagiang.jpg'),
(14, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/hagiang-2.jpg'),
(14, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/hagiang-3.jpg'),
(14, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/hagiang-4.jpg'),
(14, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/hagiang-5.jpg'),

-- Tour 15: Bình Ba
(15, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1776238854/travel-website/binhba-2.jpg'),
(15, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/binhba.jpg'),
(15, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/binhba-3.jpg'),
(15, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/binhba-4.jpg'),
(15, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/binhba-5.jpg'),

-- Tour 16: Sơn Đoòng
(16, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/sondoong.jpg'),
(16, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/sondoong-2.jpg'),
(16, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/sondoong-3.jpg'),
(16, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/sondoong-4.jpg'),
(16, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/sondoong-5.jpg'),

-- Tour 17: Vũng Tàu
(17, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/vungtau.jpg'),
(17, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/vungtau-2.jpg'),
(17, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/vungtau-3.jpg'),
(17, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/vungtau-4.jpg'),
(17, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/vungtau-5.jpg'),

-- Tour 18: Gia Lai
(18, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/gialai.jpg'),
(18, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/gialai-2.jpg'),
(18, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/gialai-3.jpg'),
(18, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/gialai-4.jpg'),
(18, 'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281352/travel-website/gialai-5.jpg');

-- 3. TOUR ITINERARIES
INSERT INTO tour_itineraries (tour_id, day_number, description) VALUES
(9, 1, 'CHÀO MỪNG CÔN ĐẢO – TÌM HIỂU LỊCH SỬ\n08:00: Hướng dẫn viên đón quý khách tại sân bay Tân Sơn Nhất, làm thủ tục bay đi Côn Đảo.\n10:30: Đến sân bay Cỏ Ống (Côn Đảo), xe đưa đoàn về trung tâm thị trấn, nhận phòng khách sạn và nghỉ ngơi ngắm cảnh biển.\n12:00: Quý khách dùng bữa trưa tại nhà hàng địa phương với các món hải sản biển đảo.\n14:00: Xe và HDV đưa đoàn tham quan Cựu nhà tù Côn Đảo, tìm hiểu về Di tích lịch sử Quốc gia đặc biệt.\n16:30: Tự do tắm biển tại Bãi Đầm Trầu.\n18:30: Ăn tối tại nhà hàng.\n23:00: Đoàn tham gia chương trình viếng Nghĩa trang Hàng Dương, viếng mộ cô Sáu linh thiêng.'),
(9, 2, 'KHÁM PHÁ HÒN BẢY CẠNH – LẶN NGẮM SAN HÔ\n07:00: Đoàn dùng điểm tâm sáng tại nhà hàng khách sạn.\n08:30: Lên cano khởi hành đi tham quan Hòn Bảy Cạnh, tham gia chương trình lặn ngắm san hô dưới đáy biển tuyệt đẹp.\n11:30: Thưởng thức bữa trưa BBQ hải sản dã ngoại ngay trên bãi biển.\n14:00: Quay về đảo lớn, tiếp tục tham quan Miếu bà Phi Yến, chùa Núi Một.\n16:00: Tự do tắm biển.\n18:30: Dùng bữa tối. Buổi tối quý khách tự do dạo biển Côn Đảo.'),
(9, 3, 'TẠM BIỆT CÔN ĐẢO\n06:30: Dùng điểm tâm sáng sớm, dạo biển đón bình minh.\n08:00: Xe đưa đoàn đi chợ Côn Đảo tự do mua sắm đặc sản bàng, hải sản khô.\n10:30: Làm thủ tục trả phòng khách sạn.\n11:30: Ăn trưa nhẹ tại nhà hàng địa phương.\n13:00: Xe đưa đoàn ra sân bay Cỏ Ống làm thủ tục đáp chuyến bay về lại điểm khởi hành, kết thúc lịch trình.'),
(10, 1, 'CHÀO MỪNG MỘC CHÂU – ĐỒI CHÈ TRÁI TIM\n06:00: Xe và HDV đón quý khách tại điểm hẹn ở Hà Nội, khởi hành đi Mộc Châu.\n09:00: Dừng chân ngắm cảnh và chụp hình tại Đèo Thung Khe.\n12:00: Đến Mộc Châu, ăn trưa tại nhà hàng với các món đặc sản Tây Bắc.\n14:00: Nhận phòng homestay và nghỉ ngơi.\n15:30: Khởi hành tham quan Đồi chè trái tim xanh mướt, tha hồ check-in sống ảo.\n18:30: Thưởng thức bữa tối đặc sản với bê chao và cá suối.\n20:00: Giao lưu lửa trại, ca múa nhạc dân tộc (nếu đi đoàn đông).'),
(10, 2, 'THÁC DẢI YẾM – RỪNG THÔNG BẢN ÁNG\n07:00: Ăn sáng tại homestay với bánh cuốn hoặc phở.\n08:30: Xe đưa đoàn đến tham quan Thác Dải Yếm hùng vĩ và dạo bước trên cầu kính Tình Yêu.\n10:30: Khám phá Rừng thông Bản Áng, đạp xe quanh hồ.\n12:30: Trả phòng và ăn trưa tại nhà hàng.\n14:00: Mua sắm đặc sản sữa Mộc Châu, chè xanh, măng khô.\n15:00: Lên xe khởi hành về lại Hà Nội.\n18:00: Về đến thủ đô, chia tay quý khách.'),
(11, 1, 'CHÀO MỪNG QUY NHƠN – THIÊN ĐƯỜNG KỲ CO\n08:00: Đón khách tại sân bay Phù Cát (Quy Nhơn), đưa đoàn về trung tâm.\n09:30: Tham quan Tháp Đôi, một trong những công trình kiến trúc Chăm cổ kính.\n11:30: Ăn trưa tại nhà hàng, sau đó nhận phòng khách sạn nghỉ ngơi.\n14:30: Khởi hành đi Kỳ Co, di chuyển bằng cano cao tốc ra đảo.\n15:00: Tắm biển Kỳ Co trong vắt, lặn ngắm san hô phong phú.\n17:00: Khám phá Eo Gió – nơi đón hoàng hôn đẹp nhất Việt Nam.\n19:00: Thưởng thức hải sản Quy Nhơn tươi sống tại nhà hàng ven biển.'),
(11, 2, 'KHÁM PHÁ PHÚ YÊN – TÔI THẤY HOA VÀNG TRÊN CỎ XANH\n07:30: Dùng buffet sáng.\n08:30: Khởi hành đi Phú Yên. Dọc đường ngắm cung đường biển tuyệt đẹp.\n10:00: Tham quan Nhà thờ Mằng Lăng cổ kính với kiến trúc Gothic.\n11:30: Thưởng thức hải sản Đầm Ô Loan trứ danh.\n14:00: Khám phá Ghềnh Đá Đĩa - kiệt tác thiên nhiên với các khối đá hình lục giác độc đáo.\n16:00: Check-in Bãi Xép – phim trường "Tôi thấy hoa vàng trên cỏ xanh".\n18:30: Trở về Quy Nhơn dùng bữa tối.'),
(11, 3, 'TẠM BIỆT QUY NHƠN\n07:00: Ăn sáng tại khách sạn.\n08:30: Tự do dạo biển ngắm bình minh, tắm biển.\n10:00: Xe đưa đoàn đi chợ mua sắm đặc sản Quy Nhơn như bánh ít lá gai, nem chả.\n11:30: Trả phòng khách sạn, dùng bữa cơm trưa nhẹ nhàng.\n13:30: Xe đưa đoàn ra sân bay Phù Cát. Kết thúc hành trình đầy kỷ niệm.'),
(12, 1, 'CHÀO MỪNG TÂY NINH – CHINH PHỤC NÚI BÀ ĐEN\n06:00: Khởi hành từ TP.HCM đi Tây Ninh.\n08:00: Thưởng thức đặc sản bánh canh Trảng Bàng.\n09:30: Đến Khu du lịch núi Bà Đen. Trải nghiệm tuyến cáp treo hiện đại lên đỉnh núi.\n10:30: Tham quan và viếng Chùa Bà, cầu bình an và tài lộc.\n11:30: Check-in đỉnh núi săn mây, chiêm ngưỡng toàn cảnh đồng bằng Tây Ninh xanh thẳm.\n12:30: Ăn trưa buffet tại nhà hàng Vân Sơn trên đỉnh núi.\n14:30: Di chuyển xuống núi, xe đưa đoàn đến Toà thánh Tây Ninh ngắm kiến trúc độc đáo.\n16:00: Mua sắm đặc sản muối tôm Tây Ninh.\n17:00: Khởi hành về lại TP.HCM, kết thúc chương trình.'),
(13, 1, 'CHÀO MỪNG CẦN THƠ – KHÁM PHÁ NÉT ĐẸP MIỀN TÂY\n07:00: Đón quý khách tại điểm hẹn TP.HCM đi miền Tây.\n09:00: Dừng chân tham quan Mekong Rest Stop.\n11:00: Đến Cần Thơ. Viếng Thiền viện Trúc Lâm Phương Nam.\n12:30: Dùng bữa trưa tại Làng Du Lịch Mỹ Khánh, thưởng thức ẩm thực miệt vườn.\n14:00: Nhận phòng khách sạn.\n15:30: Tham quan Nhà cổ Bình Thủy, nơi quay cảnh trong phim "Người Tình".\n18:30: Dùng tiệc tối trên du thuyền Cần Thơ, lênh đênh sông nước nghe đờn ca tài tử.\n21:00: Tự do dạo bến Ninh Kiều về đêm.'),
(13, 2, 'CHỢ NỔI CÁI RĂNG – TẠM BIỆT CẦN THƠ\n05:30: Thức dậy sớm, xuống thuyền đi tham quan Chợ nổi Cái Răng tấp nập giao thương trên sông.\n07:30: Trở về khách sạn dùng điểm tâm sáng.\n09:00: Tham quan lò hủ tiếu truyền thống, thử tài làm hủ tiếu pizza.\n11:30: Trả phòng khách sạn. Ăn trưa đặc sản.\n13:30: Lên xe khởi hành về lại TP.HCM, trên đường mua đặc sản trái cây miền Tây.\n17:00: Đến TP.HCM.'),
(14, 1, 'CHÀO MỪNG HÀ GIANG – CỔNG TRỜI QUẢN BẠ\n06:00: Khởi hành từ Hà Nội theo hướng cao tốc Nội Bài - Lào Cai.\n12:00: Dùng bữa trưa tại thành phố Hà Giang.\n14:00: Tiếp tục hành trình, dừng chân chụp hình tại Cột mốc số 0 Hà Giang.\n16:00: Vượt dốc Bắc Sum, check in cổng trời Quản Bạ, ngắm núi đôi Cô Tiên.\n18:30: Nhận phòng khách sạn tại Yên Minh.\n19:00: Dùng bữa tối đặc sản rừng núi, tự do nghỉ ngơi.'),
(14, 2, 'CAO NGUYÊN ĐÁ ĐỒNG VĂN – CỘT CỜ LŨNG CÚ\n07:00: Trả phòng, dùng điểm tâm sáng.\n08:30: Thăm dốc Thẩm Mã, làng văn hóa Lũng Cẩm trong phim "Chuyện của Pao".\n11:00: Di chuyển đến Dinh thự Vua Mèo Vương Chính Đức với kiến trúc độc lạ.\n12:30: Dùng bữa trưa tại nhà hàng.\n14:30: Lên xe đến Cột cờ Lũng Cú, điểm cực Bắc thiêng liêng của Tổ Quốc.\n17:00: Đến Đồng Văn, nhận phòng khách sạn nghỉ ngơi.\n19:00: Ăn tối, dạo phố cổ Đồng Văn, thưởng thức cafe phố cổ.'),
(14, 3, 'ĐÈO MÃ PÍ LÈNG – SÔNG NHO QUẾ\n07:00: Dùng bữa sáng. Nếu đúng lịch sẽ đi chợ phiên Đồng Văn.\n08:30: Trả phòng, di chuyển đi đèo Mã Pí Lèng - tứ đại đỉnh đèo ngoạn mục.\n10:00: Trải nghiệm ngồi thuyền trên dòng sông Nho Quế, ngắm hẻm Tu Sản tráng lệ.\n12:30: Dùng bữa trưa tại thị trấn Mèo Vạc.\n14:00: Lên xe về lại thành phố Hà Giang qua những cung đường đèo quanh co.\n18:30: Về đến Hà Giang, nhận phòng và ăn tối. Nghỉ đêm tại Hà Giang.'),
(14, 4, 'TẠM BIỆT HÀ GIANG\n07:00: Ăn sáng tại khách sạn, tự do mua mật ong rừng, thảo quả.\n10:00: Làm thủ tục trả phòng.\n11:30: Dùng cơm trưa tại nhà hàng.\n13:00: Khởi hành về lại Hà Nội.\n18:00: Đến Hà Nội, chia tay quý khách.'),
(15, 1, 'CHÀO MỪNG BÌNH BA – ĐẢO TÔM HÙM\n07:00: Xe đón quý khách tại điểm hẹn ở Cam Ranh, di chuyển đến cảng.\n08:00: Lên cano cao tốc ra đảo Bình Ba (đảo Tôm hùm).\n09:00: Đến đảo, di chuyển bằng xe điện đi quanh đảo tham quan Bãi Nồm, Bãi Chướng.\n11:30: Dùng bữa trưa hải sản trên bè nổi.\n14:00: Nhận phòng nhà nghỉ trên đảo, nghỉ ngơi.\n15:30: Tham gia hoạt động tắm biển và lặn ngắm san hô tại Bãi Nhà Cũ với làn nước trong vắt.\n18:30: Dùng tiệc tối với đặc sản Tôm hùm nướng trứ danh và hải sản phong phú.\n20:30: Giao lưu karaoke hoặc tự do đi bộ dạo bờ biển cực chill đêm đảo vắng.'),
(15, 2, 'NGẮM BÌNH MINH – TẠM BIỆT BÌNH BA\n05:30: Dậy sớm đi ngắm bình minh trên bãi biển hoang sơ, tận hưởng không khí trong lành.\n07:00: Thưởng thức bữa sáng với các món ăn đặc trưng của dân đảo như bún chả cá, bánh căn.\n08:30: Tự do đi chợ đảo Bình Ba tìm mua hải sản khô hoặc sống giá rẻ.\n10:00: Trả phòng, cano đưa đoàn trở lại cảng đất liền Cam Ranh.\n11:00: Lên xe đưa đoàn về sân bay hoăc trung tâm thành phố, khép lại chương trình khám phá tự nhiên tuyệt vời.'),
(16, 1, 'CHÀO MỪNG PHONG NHA – BẮT ĐẦU HÀNH TRÌNH THÁM HIỂM\n06:00: Khởi hành từ Đồng Hới đi vườn quốc gia Phong Nha - Kẻ Bàng.\n08:00: Gặp gỡ các chuyên gia hang động, kiểm tra thể lực, trang thiết bị an toàn kỹ lưỡng.\n09:30: Bắt đầu hành trình đi bộ băng rừng, lội suối xuyên qua cánh rừng rậm rạp.\n12:30: Dừng nghỉ dùng bữa trưa dã ngoại giữa thiên nhiên.\n14:00: Tiếp tục leo qua núi đá gai góc trước khi đến bản Đoòng của người dân bản địa nghỉ ngơi ngắn.\n16:30: Tiếp cận cửa hang Én, lội qua dòng suối ngầm tiến vào trong hang rộng mênh mông.\n18:00: Đội khuân vác thiết lập bãi cắm trại hoàng tráng bên trong hang Én.\n19:30: Dùng bữa tối nướng BBQ, nghe những câu chuyện thám hiểm kỳ thú.'),
(16, 2, 'CHINH PHỤC HANG SƠN ĐOÒNG VĨ ĐẠI\n07:00: Thức dậy trong ánh nắng rọi từ cửa hang khổng lồ, dùng điểm tâm.\n08:30: Bắt đầu đi sâu hơn để chính thức tiến vào cửa hang Sơn Đoòng nguyên sơ.\n10:00: Leo dốc đá trơn trượt có dây nạo bảo hiểm, băng qua các dòng sông ngầm chảy róc rách.\n12:30: Nghỉ chân trong hang tối dùng bữa trưa gọn nhẹ.\n14:00: Chiêm ngưỡng những cột thạch nhũ nghìn năm tinh xảo vĩ đại như những toà tháp chọc trời.\n16:30: Dựng lều trại tại hố sụt số 1, nơi có những tia nắng chiếu xuống tận đáy động.\n18:30: Dùng bữa tối do thợ nấu địa phương chuẩn bị. Ngủ qua đêm trong lều bạt.'),
(16, 3, 'KHÁM PHÁ THẢM THỰC VẬT ĐỘC ĐÁO\n07:00: Ăn sáng tiếp tục hành trình băng qua Doline 2, ngắm thảm thực vật mọc rợp trời xanh ngay trong lòng hang.\n09:00: Trải nghiệm đu dây (rapelling) và vượt sông ngầm với bè nổi thú vị.\n12:00: Ăn trưa tại vòm hang siêu vĩ đại được mệnh danh là Hang Sáng rực rỡ.\n14:30: Dò tìm hành lang thạch nhũ Bức tường Việt Nam cao ngất.\n17:00: Đến hố sụt số 2, cắm trại đêm cuối.\n19:00: Liên hoan chia tay hành trình thám hiểm tại đại bản doanh.'),
(16, 4, 'HOÀN THÀNH CHUYẾN THÁM HIỂM LỊCH SỬ\n07:30: Thức dậy, thu dọn toàn bộ vật dụng không để lại rác trong hang động.\n09:00: Leo khỏi Bức tường Việt Nam để thoát hang, trở ra không gian bên ngoài.\n12:00: Băng xuyên rừng nhiệt đới theo lối mòn về con đường mòn Hồ Chí Minh.\n14:30: Xe máy kéo hoặc xe off-road đón đoàn trở lại đường lớn.\n16:00: Lên xe đưa về khu resort nghỉ dưỡng tắm rửa, tận hưởng tự do thư giãn phục hồi.\n18:00: Khép lại chuyến đi lịch sử thay đổi cuộc đời.'),
(17, 1, 'CHÀO MỪNG VŨNG TÀU – CHINH PHỤC TƯỢNG CHÚA KITÔ\n07:00: Khởi hành từ TP.HCM bằng đường cao tốc Long Thành - Dầu Giây di chuyển êm ái.\n09:30: Đến Vũng Tàu. Tham quan đồi Cừu Suối Nghệ để chụp hình với những chú cừu dễ thương.\n11:30: Dùng bữa trưa tại nhà hàng trung tâm thành phố.\n13:30: Nhận phòng khách sạn, tự do nghỉ ngơi lấy sức.\n15:00: Đưa đoàn chinh phục hơn 800 bậc thang lên Tượng Chúa Kitô Vua trên núi Nhỏ, nhắm cảnh toàn TP.\n16:30: Tự do tắm biển tại Bãi Sau - Thuỳ Vân trong làn sóng hiền hoà mát rượi.\n18:30: Thưởng thức bữa tối tại chợ Quê hải sản tươi ngon, dạo biển đêm nhâm nhi cafe.'),
(17, 2, 'TẠM BIỆT VŨNG TÀU – TRỞ VỀ TP.HCM\n07:00: Thưởng thức bữa sáng sớm tại khách sạn.\n08:30: Xe đưa khách đến Mũi Nghinh Phong chụp ảnh cổng trời, thăm Hải đăng cổ hướng biển.\n10:30: Mua sắm đặc sản mắm Trí Hải, cá thu tươi, hải sản một nắng dồi dào về làm quà.\n11:30: Về lại khách sạn làm thủ tục trả phòng.\n12:30: Dùng điểm tâm trưa và ghé dùng thử sữa bò Long Thành.\n14:30: Xe xuất phát đưa đoàn trở về TP.HCM.\n17:00: Đưa đón tại điểm hẹn trung tâm.'),
(18, 1, 'CHÀO MỪNG PLEIKU – BIỂN HỒ T’NƯNG\n08:00: Đón tại sân bay Pleiku xinh đẹp đầy sương sớm.\n09:30: Khởi hành tham quan Biển Hồ T’Nưng, đôi mắt ngọc lung linh của Tây Nguyên.\n11:30: Dùng bữa trưa với món phở khô Gia Lai trứ danh nổi tiếng hai tô.\n13:30: Về khách sạn điểm trung tâm nhận phòng, thả dốc tĩnh tâm.\n15:00: Khám phá nhà máy thuỷ điện Yaly kì vĩ mang nhịp đập kinh tế của vùng rừng núi.\n17:30: Quanh quẩn quảng trường Đại Đoàn Kết, chiêm ngưỡng tượng đài Bác Hồ đồ sộ.\n19:00: Quý khách tự do ăn tối, trải nghiệm ẩm thực đường phố, gà nướng cơm lam.'),
(18, 2, 'LÀNG VĂN HÓA TÂY NGUYÊN – NÚI LỬA CHƯ ĐĂNG YA\n07:00: Ăn sáng hương vị mộc mạc đặc sắc.\n08:30: Hành trình di chuyển đến ngọn đồi chè Biển hồ bạt ngàn thẳng tắp một hàng dọc lãng mạn.\n10:00: Dạo qua Hàng thông trăm tuổi đẹp như tranh vẽ Châu Âu giữa lòng phố núi.\n11:30: Dùng tiệc trưa đặc thù vùng miền.\n13:30: Thăm Núi lửa Chư Đăng Ya mang hình phễu kỳ quan hiếm có, tuỳ thời điểm ngắm dã quỳ hoa nhuộm vàng rực núi đồi.\n15:30: Di chuyển vào sâu trong buôn làng đồng bào dân tộc thiểu số, tìm hiểu thói quen tập tục lâu đời.\n18:00: Giao lưu cồng chiêng, tận hưởng tiệc thịt nướng ngay bên bếp lửa bập bùng truyền thống.'),
(18, 3, 'TẠM BIỆT PHỐ NÚI GIA LAI\n07:30: Ngắm sương lãng đãng dạo bộ công viên, làm tô bún bò bữa sớm.\n09:00: Tự do đi tham quan mua sắm đặc sản tiêu, cafe, mắc ca ngay tại chợ nội ô.\n11:00: Thu xếp hành lí, trả phòng.\n11:30: Xe trung chuyển chở quý đoàn thưởng thức món gà xé phay thanh nhẹ cho bữa trưa.\n13:00: Đưa khách ra khu vực sân bay khởi hành về nơi bắt đầu, kết thúc tốt đẹp đầy cung bậc.');

-- 4. TOUR SERVICES
INSERT INTO tour_services (tour_id, service_id) VALUES
(9, 1), (9, 2), (9, 3), (9, 4), (9, 5),
(10, 1), (10, 2), (10, 3), (10, 4),
(11, 1), (11, 2), (11, 3), (11, 4), (11, 5),
(12, 2), (12, 3), (12, 4),
(13, 1), (13, 2), (13, 3), (13, 4),
(14, 1), (14, 2), (14, 3), (14, 4), (14, 5),
(15, 1), (15, 2), (15, 3), (15, 4),
(16, 1), (16, 2), (16, 3), (16, 4), (16, 5),
(17, 1), (17, 2), (17, 3), (17, 4),
(18, 1), (18, 2), (18, 3), (18, 4), (18, 5);

-- 5. TOUR DEPARTURES
-- Batch 1: Tự động tăng ID (Tours 9-18)
INSERT INTO tour_departures (tour_id, departure_location, departure_date, price_moving, price_moving_child, seats_total, seats_available) VALUES
(9, 'TP.HCM', '2026-05-15', 500000, 300000, 20, 20),
(10, 'Hà Nội', '2026-05-20', 300000, 200000, 25, 25),
(11, 'TP.HCM', '2026-06-01', 600000, 400000, 30, 30),
(12, 'TP.HCM', '2026-05-10', 100000, 50000, 40, 40),
(13, 'TP.HCM', '2026-05-25', 200000, 100000, 30, 30),
(14, 'Hà Nội', '2026-06-15', 400000, 200000, 25, 25),
(15, 'Nha Trang', '2026-05-18', 200000, 100000, 20, 20),
(16, 'Đồng Hới', '2026-07-01', 0, 0, 10, 10),
(17, 'TP.HCM', '2026-05-05', 100000, 50000, 45, 45),
(18, 'TP.HCM', '2026-06-10', 500000, 300000, 20, 20);

-- Batch 2: Chỉ định ID (Lịch 2025-2026 và Đợt 2)
INSERT INTO tour_departures (id, tour_id, departure_location, departure_date, price_moving, price_moving_child, seats_total, seats_available) VALUES
(27, 1, 'TP.HCM', '2025-06-15', 500000, 300000, 25, 0),
(28, 1, 'TP.HCM', '2025-11-20', 500000, 300000, 25, 0),
(29, 2, 'Đà Nẵng', '2025-07-10', 200000, 100000, 30, 0),
(30, 2, 'Hà Nội', '2025-12-05', 600000, 400000, 30, 0),
(31, 3, 'Hà Nội', '2025-08-15', 300000, 150000, 35, 0),
(32, 4, 'TP.HCM', '2025-09-02', 700000, 400000, 30, 0),
(33, 5, 'Hà Nội', '2025-10-20', 1500000, 1000000, 30, 0),
(34, 6, 'Hà Nội', '2025-11-15', 400000, 200000, 25, 0),
(35, 9, 'TP.HCM', '2025-08-25', 500000, 300000, 20, 0),
(36, 12, 'TP.HCM', '2025-09-10', 100000, 50000, 40, 0),
(37, 16, 'Đồng Hới', '2025-07-20', 0, 0, 10, 0),
(38, 17, 'TP.HCM', '2025-12-25', 100000, 50000, 45, 0),
(39, 1, 'TP.HCM', '2026-06-15', 500000, 300000, 25, 10),
(40, 2, 'Hà Nội', '2026-07-10', 600000, 400000, 30, 15),
(41, 3, 'Hà Nội', '2026-08-05', 300000, 150000, 35, 20),
(42, 4, 'TP.HCM', '2026-09-12', 700000, 400000, 30, 12),
(43, 8, 'Hà Nội', '2026-10-18', 150000, 80000, 30, 20),
(44, 9, 'TP.HCM', '2026-07-22', 500000, 300000, 20, 10),
(45, 10, 'Hà Nội', '2026-08-30', 300000, 200000, 25, 15),
(46, 14, 'Hà Nội', '2026-09-25', 400000, 200000, 25, 18),
(47, 16, 'Đồng Hới', '2026-08-15', 0, 0, 10, 5),
(48, 18, 'TP.HCM', '2026-11-20', 500000, 300000, 20, 10),
(49, 1, 'Hà Nội', '2025-05-10', 800000, 500000, 25, 0),
(50, 2, 'TP.HCM', '2025-08-22', 700000, 450000, 30, 0),
(51, 3, 'Hà Nội', '2025-06-15', 300000, 150000, 35, 0),
(52, 4, 'TP.HCM', '2025-10-10', 700000, 400000, 30, 0),
(53, 5, 'Hà Nội', '2025-12-01', 1500000, 1000000, 30, 0),
(54, 7, 'Đà Nẵng', '2025-09-05', 400000, 200000, 25, 0),
(55, 10, 'Hà Nội', '2025-10-25', 300000, 200000, 25, 0),
(56, 11, 'TP.HCM', '2025-11-11', 600000, 400000, 30, 0),
(57, 13, 'TP.HCM', '2025-08-08', 200000, 100000, 30, 0),
(58, 14, 'Hà Nội', '2025-07-20', 400000, 200000, 25, 0),
(59, 15, 'Nha Trang', '2025-06-30', 200000, 100000, 20, 0),
(60, 18, 'TP.HCM', '2025-12-12', 500000, 300000, 20, 0),
(61, 5, 'Hà Nội', '2026-05-20', 1500000, 1000000, 30, 15),
(62, 6, 'TP.HCM', '2026-04-25', 1200000, 800000, 25, 12),
(63, 7, 'Đà Nẵng', '2026-06-10', 400000, 200000, 25, 10),
(64, 11, 'TP.HCM', '2026-07-05', 600000, 400000, 30, 18),
(65, 12, 'TP.HCM', '2026-08-15', 100000, 50000, 40, 25),
(66, 13, 'TP.HCM', '2026-09-05', 200000, 100000, 30, 20),
(67, 15, 'Nha Trang', '2026-10-10', 200000, 100000, 20, 15),
(68, 17, 'TP.HCM', '2026-11-25', 100000, 50000, 45, 30),
(69, 18, 'TP.HCM', '2026-12-05', 500000, 300000, 20, 18),
(70, 4, 'Hà Nội', '2026-05-15', 1200000, 800000, 30, 12);

-- Đóng các lịch khởi hành đã qua ngày hiện tại
UPDATE tour_departures
SET status = 'closed'
WHERE id > 0 AND departure_date < CURDATE();

-- 6. BOOKINGS
-- Batch 1: Tự động tăng ID
INSERT INTO bookings (user_id, departure_id, adults, children, total_price, payment_status, status, contact_name, contact_phone, contact_email) VALUES
(4, 17, 2, 0, 8000000, 'paid', 'confirmed', 'Phạm Minh Tuấn', '0978123456', 'tuan@gmail.com'),
(5, 18, 2, 1, 5600000, 'pending', 'pending', 'Đỗ Thị Ngọc Anh', '0967123456', 'ngocanh@gmail.com'),
(6, 19, 1, 0, 3800000, 'paid', 'confirmed', 'Võ Hoàng Nam', '0945123789', 'nam@gmail.com'),
(7, 20, 4, 2, 3700000, 'refunded', 'cancelled', 'Bùi Thanh Trúc', '0923456789', 'truc@gmail.com'),
(8, 24, 2, 0, 130000000, 'paid', 'confirmed', 'Nguyễn Thị Hồng Nhung', '0398765432', 'nhung@gmail.com');

-- Batch 2: Chỉ định ID
INSERT INTO bookings (id, user_id, departure_id, adults, children, total_price, payment_status, status, contact_name, contact_phone, contact_email) VALUES
(11, 4, 27, 2, 0, 7400000, 'paid', 'confirmed', 'Phạm Minh Tuấn', '0978123456', 'tuan@gmail.com'),
(12, 5, 29, 2, 1, 8900000, 'paid', 'confirmed', 'Đỗ Thị Ngọc Anh', '0967123456', 'ngocanh@gmail.com'),
(13, 6, 31, 1, 0, 2800000, 'paid', 'confirmed', 'Võ Hoàng Nam', '0945123789', 'nam@gmail.com'),
(14, 7, 32, 2, 2, 17600000, 'paid', 'confirmed', 'Bùi Thanh Trúc', '0923456789', 'truc@gmail.com'),
(15, 8, 35, 3, 0, 12000000, 'paid', 'confirmed', 'Nguyễn Thị Hồng Nhung', '0398765432', 'nhung@gmail.com'),
(16, 4, 38, 4, 1, 7000000, 'paid', 'confirmed', 'Phạm Minh Tuấn', '0978123456', 'tuan@gmail.com'),
(17, 5, 39, 2, 0, 7400000, 'paid', 'confirmed', 'Đỗ Thị Ngọc Anh', '0967123456', 'ngocanh@gmail.com'),
(18, 6, 40, 1, 0, 3600000, 'paid', 'confirmed', 'Võ Hoàng Nam', '0945123789', 'nam@gmail.com'),
(19, 7, 44, 2, 1, 11400000, 'paid', 'confirmed', 'Bùi Thanh Trúc', '0923456789', 'truc@gmail.com'),
(20, 8, 47, 1, 0, 65000000, 'paid', 'confirmed', 'Nguyễn Thị Hồng Nhung', '0398765432', 'nhung@gmail.com'),
(21, 4, 49, 2, 1, 9300000, 'paid', 'confirmed', 'Phạm Minh Tuấn', '0978123456', 'tuan@gmail.com'),
(22, 5, 52, 2, 0, 10400000, 'paid', 'confirmed', 'Đỗ Thị Ngọc Anh', '0967123456', 'ngocanh@gmail.com'),
(23, 6, 54, 4, 0, 12800000, 'paid', 'confirmed', 'Võ Hoàng Nam', '0945123789', 'nam@gmail.com'),
(24, 7, 56, 2, 2, 12800000, 'paid', 'confirmed', 'Bùi Thanh Trúc', '0923456789', 'truc@gmail.com'),
(25, 8, 59, 1, 0, 2400000, 'paid', 'confirmed', 'Nguyễn Thị Hồng Nhung', '0398765432', 'nhung@gmail.com'),
(26, 4, 61, 2, 1, 16000000, 'paid', 'confirmed', 'Phạm Minh Tuấn', '0978123456', 'tuan@gmail.com'),
(27, 5, 62, 3, 0, 12900000, 'paid', 'confirmed', 'Đỗ Thị Ngọc Anh', '0967123456', 'ngocanh@gmail.com'),
(28, 6, 64, 2, 0, 7600000, 'paid', 'confirmed', 'Võ Hoàng Nam', '0945123789', 'nam@gmail.com'),
(29, 7, 66, 1, 1, 3800000, 'paid', 'confirmed', 'Bùi Thanh Trúc', '0923456789', 'truc@gmail.com'),
(30, 8, 68, 4, 0, 5600000, 'paid', 'confirmed', 'Nguyễn Thị Hồng Nhung', '0398765432', 'nhung@gmail.com'),
(31, 4, 53, 2, 0, 13400000, 'paid', 'confirmed', 'Phạm Minh Tuấn', '0978123456', 'tuan@gmail.com'),
(32, 5, 58, 2, 1, 11400000, 'paid', 'confirmed', 'Đỗ Thị Ngọc Anh', '0967123456', 'ngocanh@gmail.com'),
(33, 6, 60, 1, 0, 3300000, 'paid', 'confirmed', 'Võ Hoàng Nam', '0945123789', 'nam@gmail.com'),
(34, 7, 50, 2, 0, 7400000, 'paid', 'confirmed', 'Bùi Thanh Trúc', '0923456789', 'truc@gmail.com'),
(35, 8, 63, 2, 0, 6400000, 'paid', 'confirmed', 'Nguyễn Thị Hồng Nhung', '0398765432', 'nhung@gmail.com'),
(36, 4, 65, 5, 0, 3500000, 'paid', 'confirmed', 'Phạm Minh Tuấn', '0978123456', 'tuan@gmail.com'),
(37, 5, 67, 2, 1, 6400000, 'paid', 'confirmed', 'Đỗ Thị Ngọc Anh', '0967123456', 'ngocanh@gmail.com'),
(38, 6, 69, 1, 0, 3300000, 'paid', 'confirmed', 'Võ Hoàng Nam', '0945123789', 'nam@gmail.com'),
(39, 7, 70, 2, 2, 20200000, 'paid', 'confirmed', 'Bùi Thanh Trúc', '0923456789', 'truc@gmail.com'),
(40, 8, 51, 1, 0, 2800000, 'paid', 'confirmed', 'Nguyễn Thị Hồng Nhung', '0398765432', 'nhung@gmail.com');

-- 7. PASSENGERS
INSERT INTO passengers (booking_id, fullname, gender, dob, passenger_type) VALUES
(6, 'Phạm Minh Tuấn', 'Nam', '1990-05-15', 'adult'),
(6, 'Lê Thu Hương', 'Nữ', '1992-10-20', 'adult'),
(7, 'Đỗ Thị Ngọc Anh', 'Nữ', '1995-08-25', 'adult'),
(7, 'Nguyễn Trường Giang', 'Nam', '1993-02-14', 'adult'),
(7, 'Nguyễn Ngọc Hân', 'Nữ', '2019-11-30', 'child'),
(8, 'Võ Hoàng Nam', 'Nam', '1988-12-05', 'adult'),
(9, 'Bùi Thanh Trúc', 'Nữ', '1993-02-28', 'adult'),
(9, 'Trần Văn An', 'Nam', '1965-01-01', 'adult'),
(9, 'Trần Thanh Ngọc', 'Nữ', '1967-02-02', 'adult'),
(9, 'Trần Văn Mạnh', 'Nam', '1990-07-19', 'adult'),
(9, 'Trần Bình An', 'Nam', '2018-05-10', 'child'),
(9, 'Trần Thiên An', 'Nữ', '2020-08-15', 'child'),
(10, 'Nguyễn Thị Hồng Nhung', 'Nữ', '1997-09-02', 'adult'),
(10, 'Hoàng Trọng Minh', 'Nam', '1995-10-22', 'adult'),
(11, 'Phạm Minh Tuấn', 'Nam', '1990-05-15', 'adult'),
(11, 'Lê Thu Hương', 'Nữ', '1992-10-20', 'adult'),
(12, 'Đỗ Thị Ngọc Anh', 'Nữ', '1995-08-25', 'adult'),
(12, 'Nguyễn Trường Giang', 'Nam', '1993-02-14', 'adult'),
(12, 'Nguyễn Ngọc Hân', 'Nữ', '2019-11-30', 'child'),
(13, 'Võ Hoàng Nam', 'Nam', '1988-12-05', 'adult'),
(14, 'Bùi Thanh Trúc', 'Nữ', '1993-02-28', 'adult'),
(14, 'Trần Văn Khang', 'Nam', '1990-07-19', 'adult'),
(14, 'Bùi Ngọc Diệp', 'Nữ', '2018-05-10', 'child'),
(14, 'Bùi Ngọc Trâm', 'Nữ', '2020-08-15', 'child'),
(15, 'Nguyễn Thị Hồng Nhung', 'Nữ', '1997-09-02', 'adult'),
(15, 'Hoàng Trọng Minh', 'Nam', '1995-10-22', 'adult'),
(15, 'Hoàng Ngọc Điệp', 'Nữ', '1996-10-22', 'adult'),
(16, 'Phạm Minh Tuấn', 'Nam', '1990-05-15', 'adult'),
(16, 'Lê Thu Hương', 'Nữ', '1992-10-20', 'adult'),
(16, 'Phạm Khang Mập', 'Nam', '1990-05-15', 'adult'),
(16, 'Lê Thu Thuỷ', 'Nữ', '1992-10-20', 'adult'),
(16, 'Phạm Minh Khang', 'Nam', '2018-03-12', 'child'),
(17, 'Đỗ Thị Ngọc Anh', 'Nữ', '1995-08-25', 'adult'),
(17, 'Nguyễn Trường Giang', 'Nam', '1993-02-14', 'adult'),
(18, 'Võ Hoàng Nam', 'Nam', '1988-12-05', 'adult'),
(19, 'Bùi Thanh Trúc', 'Nữ', '1993-02-28', 'adult'),
(19, 'Trần Văn Mạnh', 'Nam', '1990-07-19', 'adult'),
(19, 'Bùi Ngọc Diệp', 'Nữ', '2020-05-10', 'child'),
(20, 'Nguyễn Thị Hồng Nhung', 'Nữ', '1997-09-02', 'adult'),
(21, 'Phạm Minh Tuấn', 'Nam', '1990-05-15', 'adult'),
(21, 'Lê Thu Hương', 'Nữ', '1992-10-20', 'adult'),
(21, 'Phạm Minh Khang', 'Nam', '2018-03-12', 'child'),
(22, 'Đỗ Thị Ngọc Anh', 'Nữ', '1995-08-25', 'adult'),
(22, 'Nguyễn Trường Giang', 'Nam', '1993-02-14', 'adult'),
(23, 'Võ Hoàng Nam', 'Nam', '1988-12-05', 'adult'),
(23, 'Lê Thị Thu', 'Nữ', '1990-11-11', 'adult'),
(23, 'Trần Minh Vỹ', 'Nam', '1992-05-06', 'adult'),
(23, 'Lý Tiểu Cần', 'Nữ', '1991-04-14', 'adult'),
(24, 'Bùi Thanh Trúc', 'Nữ', '1993-02-28', 'adult'),
(24, 'Trần Văn Mạnh', 'Nam', '1990-07-19', 'adult'),
(24, 'Bùi Ngọc Diệp', 'Nữ', '2020-05-10', 'child'),
(24, 'Trần Khang Mập', 'Nam', '2019-01-01', 'child'),
(25, 'Nguyễn Thị Hồng Nhung', 'Nữ', '1997-09-02', 'adult'),
(26, 'Phạm Minh Tuấn', 'Nam', '1990-05-15', 'adult'),
(26, 'Lê Thu Hương', 'Nữ', '1992-10-20', 'adult'),
(26, 'Phạm Minh Khang', 'Nam', '2018-03-12', 'child'),
(27, 'Đỗ Thị Ngọc Anh', 'Nữ', '1995-08-25', 'adult'),
(27, 'Nguyễn Trường Giang', 'Nam', '1993-02-14', 'adult'),
(27, 'Đỗ Khắc Nam', 'Nam', '1965-02-14', 'adult'),
(28, 'Võ Hoàng Nam', 'Nam', '1988-12-05', 'adult'),
(28, 'Trương Thị Ngọc', 'Nữ', '1989-12-05', 'adult'),
(29, 'Bùi Thanh Trúc', 'Nữ', '1993-02-28', 'adult'),
(29, 'Trần Vĩ Đạt', 'Nam', '2015-05-10', 'child'),
(30, 'Nguyễn Thị Hồng Nhung', 'Nữ', '1997-09-02', 'adult'),
(30, 'Lê Khắc Mạnh', 'Nam', '1996-09-02', 'adult'),
(30, 'Lê Khắc Việt', 'Nam', '1998-09-02', 'adult'),
(30, 'Trần Thuý An', 'Nữ', '1997-12-12', 'adult'),
(31, 'Phạm Minh Tuấn', 'Nam', '1990-05-15', 'adult'),
(31, 'Lê Thu Hương', 'Nữ', '1992-10-20', 'adult'),
(32, 'Đỗ Thị Ngọc Anh', 'Nữ', '1995-08-25', 'adult'),
(32, 'Nguyễn Trường Giang', 'Nam', '1993-02-14', 'adult'),
(32, 'Nguyễn Ngọc Hân', 'Nữ', '2019-11-30', 'child'),
(33, 'Võ Hoàng Nam', 'Nam', '1988-12-05', 'adult'),
(34, 'Bùi Thanh Trúc', 'Nữ', '1993-02-28', 'adult'),
(34, 'Trần Văn Mạnh', 'Nam', '1990-07-19', 'adult'),
(35, 'Nguyễn Thị Hồng Nhung', 'Nữ', '1997-09-02', 'adult'),
(35, 'Lê Khắc Mạnh', 'Nam', '1996-09-02', 'adult'),
(36, 'Phạm Minh Tuấn', 'Nam', '1990-05-15', 'adult'),
(36, 'Lê Thu Hương', 'Nữ', '1992-10-20', 'adult'),
(36, 'Phạm Hoàng Ân', 'Nam', '1960-01-01', 'adult'),
(36, 'Lê Thị Bình', 'Nữ', '1962-02-02', 'adult'),
(36, 'Phạm Khắc Hiếu', 'Nam', '1995-05-05', 'adult'),
(37, 'Đỗ Thị Ngọc Anh', 'Nữ', '1995-08-25', 'adult'),
(37, 'Nguyễn Trường Giang', 'Nam', '1993-02-14', 'adult'),
(37, 'Nguyễn Ngọc Hân', 'Nữ', '2019-11-30', 'child'),
(38, 'Võ Hoàng Nam', 'Nam', '1988-12-05', 'adult'),
(39, 'Bùi Thanh Trúc', 'Nữ', '1993-02-28', 'adult'),
(39, 'Trần Văn Mạnh', 'Nam', '1990-07-19', 'adult'),
(39, 'Bùi Ngọc Diệp', 'Nữ', '2020-05-10', 'child'),
(39, 'Trần Hữu Danh', 'Nam', '2018-01-01', 'child'),
(40, 'Nguyễn Thị Hồng Nhung', 'Nữ', '1997-09-02', 'adult');

-- 12. USERS CUSTOMER BỔ SUNG CHO DEPARTURE 9
INSERT INTO users (fullname, phone, address, email, password, role) VALUES
('Lâm Quốc Huy', '0901000001', '12 Lý Tự Trọng, Quận 1, TP.HCM', 'huy1@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Phan Thị Bảo Trân', '0901000002', '25 Hai Bà Trưng, Quận 3, TP.HCM', 'tran2@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Trịnh Minh Khoa', '0901000003', '88 Trần Hưng Đạo, Quận 5, TP.HCM', 'khoa3@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Nguyễn Hoài An', '0901000004', '14 Nguyễn Huệ, Quận 1, TP.HCM', 'an4@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Đặng Minh Phúc', '0901000005', '71 Pasteur, Quận 3, TP.HCM', 'phuc5@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Vũ Thảo Vy', '0901000006', '9 Võ Văn Tần, Quận 3, TP.HCM', 'vy6@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Lê Đình Tài', '0901000007', '33 Cách Mạng Tháng 8, Quận 10, TP.HCM', 'tai7@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Hồ Ngọc Mai', '0901000008', '117 Điện Biên Phủ, Bình Thạnh, TP.HCM', 'mai8@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Bùi Công Minh', '0901000009', '52 Nguyễn Văn Cừ, Quận 5, TP.HCM', 'minh9@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Đoàn Thị Yến Nhi', '0901000010', '18 Phạm Ngũ Lão, Quận 1, TP.HCM', 'nhi10@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Lương Văn Khải', '0901000011', '90 Lê Lai, Quận 1, TP.HCM', 'khai11@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Tạ Thanh Vân', '0901000012', '64 Bùi Viện, Quận 1, TP.HCM', 'van12@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Ngô Đức Hòa', '0901000013', '27 Nguyễn Trãi, Quận 5, TP.HCM', 'hoa13@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Mai Phương Linh', '0901000014', '101 Trường Chinh, Tân Bình, TP.HCM', 'linh14@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Trần Nhật Nam', '0901000015', '8 Hoàng Sa, Quận 3, TP.HCM', 'nam15@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Phạm Gia Hân', '0901000016', '73 Nguyễn Đình Chiểu, Quận 3, TP.HCM', 'han16@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Châu Thanh Tùng', '0901000017', '45 Võ Thị Sáu, Quận 3, TP.HCM', 'tung17@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Nguyễn Ánh Dương', '0901000018', '29 Nguyễn Văn Thủ, Quận 1, TP.HCM', 'duong18@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Phùng Đức Thịnh', '0901000019', '66 Điện Biên Phủ, Bình Thạnh, TP.HCM', 'thinh19@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Đỗ Hải Yến', '0901000020', '15 Lý Chính Thắng, Quận 3, TP.HCM', 'yen20@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Văn Quốc Bảo', '0901000021', '38 Nguyễn Văn Đậu, Bình Thạnh, TP.HCM', 'bao21@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Lý Thị Kim Ngân', '0901000022', '11 Pasteur, Quận 1, TP.HCM', 'ngan22@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Đặng Quốc Việt', '0901000023', '19 Nam Kỳ Khởi Nghĩa, Quận 3, TP.HCM', 'viet23@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Trần Thu Hằng', '0901000024', '77 Võ Văn Kiệt, Quận 1, TP.HCM', 'hang24@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer'),
('Nguyễn Duy Khánh', '0901000025', '5 Nguyễn Bỉnh Khiêm, Quận 1, TP.HCM', 'khanh25@gmail.com', '$2b$10$oQphIt4vnkHttKmP6dgzzOtFHp.E3Xb3FQvpDtLkpgIDXrUeIi8tm', 'customer');

-- 13. BOOKINGS LẤP ĐẦY DEPARTURE 9
INSERT INTO bookings (user_id, departure_id, adults, children, total_price, payment_status, status, contact_name, contact_phone, contact_email, created_at) VALUES
(9, 9, 1, 0, 6000000, 'paid', 'confirmed', 'Lâm Quốc Huy', '0901000001', 'huy1@gmail.com', '2026-03-03 09:10:00'),
(10, 9, 1, 0, 6000000, 'paid', 'confirmed', 'Phan Thị Bảo Trân', '0901000002', 'tran2@gmail.com', '2026-03-05 11:25:00'),
(11, 9, 1, 0, 6000000, 'paid', 'confirmed', 'Trịnh Minh Khoa', '0901000003', 'khoa3@gmail.com', '2026-03-08 14:40:00'),
(12, 9, 1, 0, 6000000, 'paid', 'confirmed', 'Nguyễn Hoài An', '0901000004', 'an4@gmail.com', '2026-03-10 10:05:00'),
(13, 9, 1, 0, 6000000, 'paid', 'confirmed', 'Đặng Minh Phúc', '0901000005', 'phuc5@gmail.com', '2026-03-12 16:20:00'),
(14, 9, 1, 0, 6000000, 'paid', 'confirmed', 'Vũ Thảo Vy', '0901000006', 'vy6@gmail.com', '2026-03-15 09:30:00'),
(15, 9, 1, 0, 6000000, 'paid', 'confirmed', 'Lê Đình Tài', '0901000007', 'tai7@gmail.com', '2026-03-18 13:10:00'),
(16, 9, 1, 0, 6000000, 'paid', 'confirmed', 'Hồ Ngọc Mai', '0901000008', 'mai8@gmail.com', '2026-03-20 08:45:00'),
(17, 9, 1, 0, 6000000, 'paid', 'confirmed', 'Bùi Công Minh', '0901000009', 'minh9@gmail.com', '2026-03-22 15:00:00'),
(18, 9, 1, 0, 6000000, 'paid', 'confirmed', 'Đoàn Thị Yến Nhi', '0901000010', 'nhi10@gmail.com', '2026-03-25 10:30:00'),
(19, 9, 1, 0, 6000000, 'paid', 'confirmed', 'Lương Văn Khải', '0901000011', 'khai11@gmail.com', '2026-03-28 14:15:00'),
(20, 9, 1, 0, 6000000, 'paid', 'confirmed', 'Tạ Thanh Vân', '0901000012', 'van12@gmail.com', '2026-03-30 09:55:00'),
(21, 9, 1, 0, 6000000, 'paid', 'confirmed', 'Ngô Đức Hòa', '0901000013', 'hoa13@gmail.com', '2026-04-02 11:40:00'),
(22, 9, 1, 0, 6000000, 'paid', 'confirmed', 'Mai Phương Linh', '0901000014', 'linh14@gmail.com', '2026-04-04 16:05:00'),
(23, 9, 1, 0, 6000000, 'paid', 'confirmed', 'Trần Nhật Nam', '0901000015', 'nam15@gmail.com', '2026-04-06 09:20:00'),
(24, 9, 1, 0, 6000000, 'paid', 'confirmed', 'Phạm Gia Hân', '0901000016', 'han16@gmail.com', '2026-04-08 13:35:00'),
(25, 9, 1, 0, 6000000, 'paid', 'confirmed', 'Châu Thanh Tùng', '0901000017', 'tung17@gmail.com', '2026-04-10 10:10:00'),
(26, 9, 1, 0, 6000000, 'paid', 'confirmed', 'Nguyễn Ánh Dương', '0901000018', 'duong18@gmail.com', '2026-04-12 15:45:00'),
(27, 9, 1, 0, 6000000, 'paid', 'confirmed', 'Phùng Đức Thịnh', '0901000019', 'thinh19@gmail.com', '2026-04-14 09:00:00'),
(28, 9, 1, 0, 6000000, 'paid', 'confirmed', 'Đỗ Hải Yến', '0901000020', 'yen20@gmail.com', '2026-04-16 12:25:00'),
(29, 9, 1, 0, 6000000, 'paid', 'confirmed', 'Văn Quốc Bảo', '0901000021', 'bao21@gmail.com', '2026-04-18 14:50:00'),
(30, 9, 1, 0, 6000000, 'paid', 'confirmed', 'Lý Thị Kim Ngân', '0901000022', 'ngan22@gmail.com', '2026-04-19 10:05:00'),
(31, 9, 1, 0, 6000000, 'paid', 'confirmed', 'Đặng Quốc Việt', '0901000023', 'viet23@gmail.com', '2026-04-20 16:30:00'),
(32, 9, 1, 0, 6000000, 'paid', 'confirmed', 'Trần Thu Hằng', '0901000024', 'hang24@gmail.com', '2026-04-21 09:15:00'),
(33, 9, 1, 0, 6000000, 'paid', 'confirmed', 'Nguyễn Duy Khánh', '0901000025', 'khanh25@gmail.com', '2026-04-22 11:20:00');

-- 14. PASSENGERS TƯƠNG ỨNG CHO DEPARTURE 9
INSERT INTO passengers (booking_id, fullname, gender, dob, passenger_type) VALUES
(41, 'Lâm Quốc Huy', 'Nam', '1992-06-12', 'adult'),
(42, 'Phan Thị Bảo Trân', 'Nữ', '1994-08-03', 'adult'),
(43, 'Trịnh Minh Khoa', 'Nam', '1990-01-20', 'adult'),
(44, 'Nguyễn Hoài An', 'Nữ', '1996-11-15', 'adult'),
(45, 'Đặng Minh Phúc', 'Nam', '1989-09-09', 'adult'),
(46, 'Vũ Thảo Vy', 'Nữ', '1998-04-28', 'adult'),
(47, 'Lê Đình Tài', 'Nam', '1991-12-19', 'adult'),
(48, 'Hồ Ngọc Mai', 'Nữ', '1993-07-07', 'adult'),
(49, 'Bùi Công Minh', 'Nam', '1995-03-21', 'adult'),
(50, 'Đoàn Thị Yến Nhi', 'Nữ', '1997-10-10', 'adult'),
(51, 'Lương Văn Khải', 'Nam', '1992-05-05', 'adult'),
(52, 'Tạ Thanh Vân', 'Nữ', '1994-02-14', 'adult'),
(53, 'Ngô Đức Hòa', 'Nam', '1988-08-18', 'adult'),
(54, 'Mai Phương Linh', 'Nữ', '1999-01-26', 'adult'),
(55, 'Trần Nhật Nam', 'Nam', '1990-10-30', 'adult'),
(56, 'Phạm Gia Hân', 'Nữ', '1996-06-06', 'adult'),
(57, 'Châu Thanh Tùng', 'Nam', '1993-11-11', 'adult'),
(58, 'Nguyễn Ánh Dương', 'Nữ', '1995-12-12', 'adult'),
(59, 'Phùng Đức Thịnh', 'Nam', '1991-07-02', 'adult'),
(60, 'Đỗ Hải Yến', 'Nữ', '1998-09-29', 'adult'),
(61, 'Văn Quốc Bảo', 'Nam', '1992-03-03', 'adult'),
(62, 'Lý Thị Kim Ngân', 'Nữ', '1997-05-17', 'adult'),
(63, 'Đặng Quốc Việt', 'Nam', '1989-04-04', 'adult'),
(64, 'Trần Thu Hằng', 'Nữ', '1994-09-24', 'adult'),
(65, 'Nguyễn Duy Khánh', 'Nam', '1991-01-08', 'adult');

-- 8. REVIEWS
-- Lưu ý: Mỗi user chỉ được review 1 tour duy nhất 1 lần (UNIQUE KEY uk_user_tour_review)
-- Các booking trùng user+tour (11,12,13,20,21,28,31,38,39) sẽ không có review
INSERT INTO reviews (user_id, tour_id, rating, comment, booking_id) VALUES
(4, 1, 5, 'Tour Đà Lạt lần nào đi cũng thấy yêu, không khí trong lành, dịch vụ tour chuyên nghiệp.', 1),
(5, 2, 4, 'Tour Đà Nẵng – Hội An khá tốt, đặc biệt ấn tượng với Bà Nà Hills và Cầu Vàng. Dịch vụ ổn, sẽ quay lại.', 2),
(6, 3, 5, 'Hạ Long quá đẹp, du thuyền sang trọng, đồ ăn ngon. Đây là chuyến đi đáng nhớ nhất của tôi.', 3),
(7, 5, 5, 'Phú Quốc rất đẹp, biển trong xanh, dịch vụ resort tốt. Trải nghiệm cáp treo Hòn Thơm rất ấn tượng.', 4),
(8, 6, 4, 'Sapa mát mẻ, cảnh đẹp, Fansipan rất hùng vĩ. Tuy nhiên thời tiết hơi lạnh nhưng vẫn rất đáng trải nghiệm.', 5),
(4, 9, 5, 'Tour Côn Đảo rất thanh bình, phù hợp để đi tìm sự tĩnh lặng và ngắm biển hoang sơ.', 6),
(5, 10, 4, 'Mộc Châu mùa hoa mận tuyệt vời, thác Dải Yếm rất đẹp. Điểm trừ là đồ ăn hơi cay so với mình.', 7),
(6, 11, 5, 'Biển Kỳ Co rất trong xanh, hướng dẫn viên nhiệt tình, hải sản Quy Nhơn ngon bá cháy!', 8),
(7, 12, 5, 'Chuyến đi Tây Ninh rất ý nghĩa gia đình mình đi dịp cuối tuần. Cáp treo hiện đại, ngắm được toàn cảnh quá đã.', 9),
(8, 16, 5, 'Chuyến thám hiểm Sơn Đoòng thực sự là một trải nghiệm thay đổi cuộc đời tôi. Quá vĩ đại!', 10),
(7, 4, 4, 'Biển Nha Trang trong xanh, các trò chơi tại VinWonders rất vui và đa dạng.', 14),
(8, 9, 5, 'Côn Đảo mang vẻ đẹp hoang sơ và linh thiêng, một chuyến đi rất ý nghĩa cho tâm hồn.', 15),
(4, 17, 4, 'Vũng Tàu gần nên đi cuối tuần rất tiện, đồ ăn ngon và giá cả hợp lý.', 16),
(5, 1, 5, 'Đà Lạt vẫn giữ được nét thơ mộng vốn có, lịch trình tour được sắp xếp khoa học.', 17),
(6, 2, 5, 'Hội An lung linh về đêm, tôi rất thích không khí cổ kính và bình lặng ở đây.', 18),
(7, 9, 5, 'Dịch vụ ở Côn Đảo ngày càng tốt hơn, hướng dẫn viên kể chuyện lịch sử rất cảm động.', 19),
(5, 4, 5, 'Check-in Nha Trang mùa này biển đẹp tuyệt, tour đi các đảo lặn ngắm san hô rất vui.', 22),
(6, 7, 5, 'Cố đô Huế mang vẻ đẹp trầm mặc, các di tích lăng tẩm được bảo tồn rất tốt.', 23),
(7, 11, 4, 'Quy Nhơn nắng gió nhưng biển Kỳ Co thì không chê vào đâu được, nước trong vắt.', 24),
(8, 15, 5, 'Đảo Bình Ba yên bình, trải nghiệm ăn tôm hùm nướng ngay trên bè thực sự rất ngon.', 25),
(4, 5, 5, 'Phú Quốc mùa này nắng vàng biển xanh, rất phù hợp cho một kỳ nghỉ dưỡng thực thụ.', 26),
(5, 6, 5, 'Chinh phục đỉnh Fansipan là trải nghiệm không thể quên, cảm giác đứng giữa mây trời rất tuyệt.', 27),
(7, 13, 4, 'Chợ nổi Cái Răng tấp nập, trải nghiệm sông nước miền Tây thật thú vị và dân dã.', 29),
(8, 17, 5, 'Tượng Chúa Kitô view từ trên cao ngắm toàn cảnh Vũng Tàu đẹp mê hồn, đáng để leo bậc thang.', 30),
(5, 3, 4, 'Phong cảnh Vịnh Hạ Long mờ ảo trong sương rất đẹp, đồ ăn trên tàu đa dạng.', 32),
(6, 18, 5, 'Biển Hồ Pleiku xanh mướt, không khí cao nguyên buổi sớm thật dễ chịu và sảng khoái.', 33),
(7, 2, 5, 'Đà Nẵng sạch sẽ, văn minh, tour đi Bà Nà được sắp xếp rất đúng giờ và không phải chờ đợi lâu.', 34),
(8, 7, 4, 'Thưởng thức ca Huế trên sông Hương là một trải nghiệm văn hóa rất đặc sắc.', 35),
(4, 12, 5, 'Cáp treo lên đỉnh Núi Bà Đen nhanh và hiện đại, dịch vụ tại khu du lịch rất tốt.', 36),
(5, 15, 5, 'Bãi biển Bình Ba hoang sơ, hải sản tươi sống giá cả phải chăng, rất hài lòng với chuyến đi.', 37),
(8, 3, 5, 'Tour tổ chức chuyên nghiệp, xe đưa đón đời mới đi rất êm, HDV cực kỳ vui tính.', 40);

-- 9. WISHLIST
INSERT INTO wishlist (user_id, tour_id) VALUES
(4, 15), (4, 18),
(5, 10), (5, 11),
(6, 9), (6, 16),
(7, 12),
(8, 13), (8, 14), (8, 17);

-- 10. BỔ SUNG BOOKINGS CHO CÁC DEPARTURES CHƯA CÓ BOOKING
INSERT INTO bookings
(user_id, departure_id, adults, children, total_price, payment_status, status, contact_name, contact_phone, contact_email, created_at) VALUES
(4, 1, 1, 0, 3700000, 'paid', 'confirmed', 'Phạm Minh Tuấn', '0978123456', 'tuan@gmail.com', '2026-02-10 09:15:00'),
(5, 2, 1, 0, 3700000, 'paid', 'confirmed', 'Đỗ Thị Ngọc Anh', '0967123456', 'ngocanh@gmail.com', '2026-02-15 10:00:00'),
(6, 3, 1, 0, 3200000, 'paid', 'confirmed', 'Võ Hoàng Nam', '0945123789', 'nam@gmail.com', '2026-02-20 11:00:00'),
(7, 4, 1, 0, 3600000, 'paid', 'confirmed', 'Bùi Thanh Trúc', '0923456789', 'truc@gmail.com', '2026-02-25 14:00:00'),
(8, 5, 1, 0, 2800000, 'paid', 'confirmed', 'Nguyễn Thị Hồng Nhung', '0398765432', 'nhung@gmail.com', '2026-03-01 09:45:00'),
(4, 6, 1, 0, 2800000, 'paid', 'confirmed', 'Phạm Minh Tuấn', '0978123456', 'tuan@gmail.com', '2026-03-05 10:30:00'),
(5, 7, 1, 0, 5200000, 'paid', 'confirmed', 'Đỗ Thị Ngọc Anh', '0967123456', 'ngocanh@gmail.com', '2026-03-10 13:00:00'),
(6, 8, 1, 0, 5700000, 'paid', 'confirmed', 'Võ Hoàng Nam', '0945123789', 'nam@gmail.com', '2026-03-15 09:20:00'),
(7, 9, 1, 0, 6000000, 'paid', 'confirmed', 'Bùi Thanh Trúc', '0923456789', 'truc@gmail.com', '2026-03-20 15:00:00'),
(8, 10, 1, 0, 6700000, 'paid', 'confirmed', 'Nguyễn Thị Hồng Nhung', '0398765432', 'nhung@gmail.com', '2026-03-25 08:50:00'),
(4, 11, 1, 0, 3500000, 'paid', 'confirmed', 'Phạm Minh Tuấn', '0978123456', 'tuan@gmail.com', '2026-04-01 10:00:00'),
(5, 12, 1, 0, 4300000, 'paid', 'confirmed', 'Đỗ Thị Ngọc Anh', '0967123456', 'ngocanh@gmail.com', '2026-04-03 11:30:00'),
(6, 13, 1, 0, 3000000, 'paid', 'confirmed', 'Võ Hoàng Nam', '0945123789', 'nam@gmail.com', '2026-04-05 09:00:00'),
(7, 14, 1, 0, 3200000, 'paid', 'confirmed', 'Bùi Thanh Trúc', '0923456789', 'truc@gmail.com', '2026-04-07 14:15:00'),
(8, 15, 1, 0, 2350000, 'paid', 'confirmed', 'Nguyễn Thị Hồng Nhung', '0398765432', 'nhung@gmail.com', '2026-04-09 10:10:00'),
(4, 16, 1, 0, 3100000, 'paid', 'confirmed', 'Phạm Minh Tuấn', '0978123456', 'tuan@gmail.com', '2026-04-10 09:40:00'),
(5, 28, 1, 0, 3700000, 'paid', 'confirmed', 'Đỗ Thị Ngọc Anh', '0967123456', 'ngocanh@gmail.com', '2026-04-12 10:00:00'),
(6, 30, 1, 0, 3600000, 'paid', 'confirmed', 'Võ Hoàng Nam', '0945123789', 'nam@gmail.com', '2026-04-14 10:30:00'),
(7, 33, 1, 0, 6700000, 'paid', 'confirmed', 'Bùi Thanh Trúc', '0923456789', 'truc@gmail.com', '2026-04-15 14:00:00'),
(8, 34, 1, 0, 3500000, 'paid', 'confirmed', 'Nguyễn Thị Hồng Nhung', '0398765432', 'nhung@gmail.com', '2026-04-16 09:10:00'),
(4, 36, 1, 0, 4300000, 'paid', 'confirmed', 'Phạm Minh Tuấn', '0978123456', 'tuan@gmail.com', '2026-04-18 08:40:00'),
(5, 37, 1, 0, 65000000, 'paid', 'confirmed', 'Đỗ Thị Ngọc Anh', '0967123456', 'ngocanh@gmail.com', '2026-04-19 11:20:00'),
(6, 43, 1, 0, 2350000, 'paid', 'confirmed', 'Võ Hoàng Nam', '0945123789', 'nam@gmail.com', '2026-04-20 10:00:00'),
(7, 45, 1, 0, 2100000, 'paid', 'confirmed', 'Bùi Thanh Trúc', '0923456789', 'truc@gmail.com', '2026-04-21 09:00:00'),
(8, 46, 1, 0, 4200000, 'paid', 'confirmed', 'Nguyễn Thị Hồng Nhung', '0398765432', 'nhung@gmail.com', '2026-04-22 13:30:00'),
(4, 48, 1, 0, 3300000, 'paid', 'confirmed', 'Phạm Minh Tuấn', '0978123456', 'tuan@gmail.com', '2026-04-23 09:15:00'),
(5, 55, 1, 0, 2100000, 'paid', 'confirmed', 'Đỗ Thị Ngọc Anh', '0967123456', 'ngocanh@gmail.com', '2026-04-23 10:00:00');

-- 11. PASSENGERS TƯƠNG ỨNG CHO CÁC BOOKING BỔ SUNG
INSERT INTO passengers (booking_id, fullname, gender, dob, passenger_type) VALUES

(68, 'Võ Hoàng Nam', 'Nam', '1988-12-05', 'adult'),
(69, 'Bùi Thanh Trúc', 'Nữ', '1993-02-28', 'adult'),
(70, 'Nguyễn Thị Hồng Nhung', 'Nữ', '1997-09-02', 'adult'),
(71, 'Phạm Minh Tuấn', 'Nam', '1990-05-15', 'adult'),
(72, 'Đỗ Thị Ngọc Anh', 'Nữ', '1995-08-25', 'adult'),
(73, 'Võ Hoàng Nam', 'Nam', '1988-12-05', 'adult'),
(74, 'Bùi Thanh Trúc', 'Nữ', '1993-02-28', 'adult'),
(75, 'Nguyễn Thị Hồng Nhung', 'Nữ', '1997-09-02', 'adult'),
(76, 'Phạm Minh Tuấn', 'Nam', '1990-05-15', 'adult'),
(77, 'Đỗ Thị Ngọc Anh', 'Nữ', '1995-08-25', 'adult'),
(78, 'Võ Hoàng Nam', 'Nam', '1988-12-05', 'adult'),
(79, 'Bùi Thanh Trúc', 'Nữ', '1993-02-28', 'adult'),
(80, 'Nguyễn Thị Hồng Nhung', 'Nữ', '1997-09-02', 'adult'),
(81, 'Phạm Minh Tuấn', 'Nam', '1990-05-15', 'adult'),
(82, 'Đỗ Thị Ngọc Anh', 'Nữ', '1995-08-25', 'adult'),
(83, 'Võ Hoàng Nam', 'Nam', '1988-12-05', 'adult'),
(84, 'Bùi Thanh Trúc', 'Nữ', '1993-02-28', 'adult'),
(85, 'Nguyễn Thị Hồng Nhung', 'Nữ', '1997-09-02', 'adult'),
(86, 'Phạm Minh Tuấn', 'Nam', '1990-05-15', 'adult'),
(87, 'Đỗ Thị Ngọc Anh', 'Nữ', '1995-08-25', 'adult'),
(88, 'Võ Hoàng Nam', 'Nam', '1988-12-05', 'adult'),
(89, 'Bùi Thanh Trúc', 'Nữ', '1993-02-28', 'adult'),
(90, 'Nguyễn Thị Hồng Nhung', 'Nữ', '1997-09-02', 'adult'),
(91, 'Phạm Minh Tuấn', 'Nam', '1990-05-15', 'adult'),
(92, 'Đỗ Thị Ngọc Anh', 'Nữ', '1995-08-25', 'adult');

