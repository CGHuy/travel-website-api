USE db_viet_tour;

-- =========================
-- 1. USERS
-- =========================
INSERT INTO users (fullname, phone, email, password, role) VALUES
('Nguyễn Văn Hùng','0987654321','[hung@gmail.com](mailto:hung@gmail.com)','123456','admin'),
('Trần Thị Mai','0912345678','[mai@gmail.com](mailto:mai@gmail.com)','123456','tour-staff'),
('Lê Quốc Bảo','0934567890','[bao.staff@gmail.com](mailto:bao.staff@gmail.com)','123456','booking-staff'),
('Phạm Minh Tuấn','0978123456','[tuan@gmail.com](mailto:tuan@gmail.com)','123456','customer'),
('Đỗ Thị Ngọc Anh','0967123456','[ngocanh@gmail.com](mailto:ngocanh@gmail.com)','123456','customer'),
('Võ Hoàng Nam','0945123789','[nam@gmail.com](mailto:nam@gmail.com)','123456','customer'),
('Bùi Thanh Trúc','0923456789','[truc@gmail.com](mailto:truc@gmail.com)','123456','customer'),
('Nguyễn Thị Hồng Nhung','0398765432','[nhung@gmail.com](mailto:nhung@gmail.com)','123456','customer'),
('Trần Quốc Khánh','0387654321','[khanh@gmail.com](mailto:khanh@gmail.com)','123456','customer');

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
'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281113/travel-website/ninhbinh.jpg');

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
(8,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281113/travel-website/ninhbinh.jpg'),
(8,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281113/travel-website/ninhbinh-2.jpg'),
(8,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281114/travel-website/ninhbinh-3.jpg'),
(8,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281115/travel-website/ninhbinh-4.jpg'),
(8,'https://res.cloudinary.com/dtsroyjxz/image/upload/v1774281116/travel-website/ninhbinh-5.jpg');

-- =========================
-- 4. ITINERARIES (THEO BẠN)
-- =========================
INSERT INTO tour_itineraries (tour_id, day_number, description) VALUES

(1,1,'Ngày 1: Đón khách tại sân bay/bến xe, di chuyển về trung tâm thành phố Đà Lạt. Tham quan hồ Xuân Hương, quảng trường Lâm Viên và check-in với biểu tượng nụ hoa Atiso. Buổi chiều tham quan thung lũng Tình Yêu, vườn hoa thành phố. Buổi tối tự do dạo chợ đêm Đà Lạt, thưởng thức ẩm thực địa phương.'),
(1,2,'Ngày 2: Khởi hành tham quan đồi chè Cầu Đất, săn mây vào buổi sáng sớm. Tiếp tục tham quan thác Datanla, trải nghiệm máng trượt hiện đại. Buổi chiều ghé tham quan chùa Linh Phước (chùa Ve Chai) với kiến trúc độc đáo. Tối nghỉ ngơi tại khách sạn.'),
(1,3,'Ngày 3: Tham quan chợ Đà Lạt, mua đặc sản như mứt, trà, dâu tây. Làm thủ tục trả phòng và kết thúc chương trình.'),

(2,1,'Ngày 1: Đón khách tại Đà Nẵng, di chuyển về Hội An. Tham quan phố cổ Hội An với các địa điểm nổi tiếng như Chùa Cầu, nhà cổ Tấn Ký, hội quán Phúc Kiến. Buổi tối dạo phố đèn lồng, thưởng thức đặc sản.'),
(2,2,'Ngày 2: Trải nghiệm thả đèn hoa đăng trên sông Hoài, tham quan làng nghề truyền thống như làng gốm Thanh Hà, làng rau Trà Quế. Buổi chiều tự do mua sắm.'),
(2,3,'Ngày 3: Tắm biển An Bàng, nghỉ ngơi và thư giãn. Kết thúc tour.'),

(3,1,'Ngày 1: Khởi hành từ Hà Nội đến Hạ Long. Lên du thuyền, nhận phòng và thưởng thức bữa trưa. Tham quan hang Sửng Sốt, chèo kayak và tắm biển. Buổi tối ăn tối trên tàu và tham gia câu mực đêm.'),
(3,2,'Ngày 2: Tập thể dục buổi sáng trên boong tàu, ngắm bình minh trên vịnh. Tham quan thêm các hang động và trả phòng, kết thúc hành trình.'),

(4,1,'Ngày 1: Đón khách tại sân bay Cam Ranh, di chuyển về khách sạn. Tự do tắm biển Nha Trang, tham quan quảng trường và chợ đêm.'),
(4,2,'Ngày 2: Tham quan VinWonders, trải nghiệm các trò chơi cảm giác mạnh và công viên nước.'),
(4,3,'Ngày 3: Tham gia tour đảo, lặn biển ngắm san hô, thưởng thức hải sản tươi sống.'),
(4,4,'Ngày 4: Mua sắm đặc sản, làm thủ tục trả phòng và kết thúc chuyến đi.'),

(5,1,'Ngày 1: Đón khách tại sân bay Phú Quốc, nhận phòng resort và nghỉ ngơi. Buổi chiều tắm biển, thư giãn.'),
(5,2,'Ngày 2: Trải nghiệm cáp treo Hòn Thơm, tham gia các hoạt động vui chơi và tắm biển.'),
(5,3,'Ngày 3: Lặn biển ngắm san hô, tham quan nhà thùng nước mắm, chợ đêm Phú Quốc.'),
(5,4,'Ngày 4: Tự do nghỉ dưỡng, mua sắm đặc sản và kết thúc tour.'),

(6,1,'Ngày 1: Di chuyển từ Hà Nội đến Sapa. Tham quan bản Cát Cát, tìm hiểu văn hóa người H’Mông.'),
(6,2,'Ngày 2: Chinh phục đỉnh Fansipan bằng cáp treo, ngắm toàn cảnh núi rừng Tây Bắc.'),
(6,3,'Ngày 3: Tham quan chợ Sapa, mua đặc sản và kết thúc tour.'),

(7,1,'Ngày 1: Đón khách tại Huế, tham quan Đại Nội – Hoàng thành của triều Nguyễn.'),
(7,2,'Ngày 2: Tham quan chùa Thiên Mụ, lăng Khải Định, du thuyền sông Hương.'),
(7,3,'Ngày 3: Tham quan chợ Đông Ba, kết thúc tour.'),

(8,1,'Ngày 1: Khởi hành từ Hà Nội, tham quan Tràng An bằng thuyền.'),
(8,2,'Ngày 2: Tham quan Tam Cốc – Bích Động và chùa Bái Đính.');

-- =========================
-- 5. DEPARTURES
-- =========================
INSERT INTO tour_departures (tour_id, departure_location, departure_date, price_moving, price_moving_child, seats_total, seats_available) VALUES
(1,'TP.HCM','2026-04-01',500000,300000,25,20),
(2,'Đà Nẵng','2026-04-05',200000,100000,30,28),
(3,'Hà Nội','2026-04-08',300000,150000,35,30),
(4,'TP.HCM','2026-05-01',700000,400000,30,25),
(5,'TP.HCM','2026-05-05',800000,500000,30,27),
(6,'Hà Nội','2026-05-10',400000,200000,25,22),
(7,'Huế','2026-04-12',200000,100000,25,22),
(8,'Hà Nội','2026-04-18',150000,80000,30,28);

-- =========================
-- 6. SERVICES
-- =========================
INSERT INTO services (name, slug, description) VALUES
('Ăn sáng','an-sang','Buffet sáng'),
('Xe đưa đón','xe-dua-don','Xe tận nơi'),
('HDV','hdv','Hướng dẫn viên'),
('Vé tham quan','ve','Bao gồm vé'),
('Bảo hiểm','bao-hiem','Bảo hiểm du lịch');

-- =========================
-- 7. TOUR SERVICES
-- =========================
INSERT INTO tour_services (tour_id, service_id) VALUES
(1,1),(1,2),(1,3),
(2,1),(2,3),
(3,1),(3,4),
(4,1),(4,2),(4,4),
(5,1),(5,2),(5,3),
(6,1),(6,3),
(7,1),(7,2),(7,3),
(8,1),(8,3);

-- =========================
-- 8. BOOKINGS
-- =========================
INSERT INTO bookings (user_id, departure_id, adults, children, total_price, payment_status, status, contact_name, contact_phone, contact_email) VALUES
(4,1,2,1,7000000,'paid','confirmed','Phạm Minh Tuấn','0978123456','[tuan@gmail.com](mailto:tuan@gmail.com)'),
(5,2,1,1,3500000,'paid','confirmed','Đỗ Thị Ngọc Anh','0967123456','[ngocanh@gmail.com](mailto:ngocanh@gmail.com)');

-- =========================
-- 9. REVIEWS
-- =========================
INSERT INTO reviews (user_id, tour_id, rating, comment) VALUES
(4,1,5,'Tour rất tuyệt vời'),
(5,2,4,'Dịch vụ tốt');

-- =========================
-- 10. WISHLIST
-- =========================
INSERT INTO wishlist (user_id, tour_id) VALUES
(4,5),(5,4);
