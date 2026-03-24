USE db_viet_tour;

-- =========================
-- 1. USERS
-- =========================
INSERT INTO users (fullname, phone, email, password, role) VALUES
('Nguyễn Văn Hùng','0987654321','hung@gmail.com','123456','admin'),
('Trần Thị Mai','0912345678','mai@gmail.com','123456','tour-staff'),
('Lê Quốc Bảo','0934567890','bao.staff@gmail.com','123456','booking-staff'),
('Phạm Minh Tuấn','0978123456','tuan@gmail.com','123456','customer'),
('Đỗ Thị Ngọc Anh','0967123456','ngocanh@gmail.com','123456','customer'),
('Võ Hoàng Nam','0945123789','nam@gmail.com','123456','customer'),
('Bùi Thanh Trúc','0923456789','truc@gmail.com','123456','customer'),
('Nguyễn Thị Hồng Nhung','0398765432','nhung@gmail.com','123456','customer');

-- =========================
-- 2. TOURS (DESCRIPTION RẤT CHI TIẾT)
-- =========================
INSERT INTO tours (name, slug, description, location, region, duration, price_default, price_child) VALUES

('Tour Đà Lạt 3N2Đ','tour-da-lat',
'Chương trình du lịch Đà Lạt 3 ngày 2 đêm là hành trình nghỉ dưỡng kết hợp tham quan dành cho du khách yêu thích khí hậu mát mẻ, thiên nhiên xanh và không gian yên bình. Ngay từ khi đặt chân đến Đà Lạt, du khách sẽ cảm nhận được không khí trong lành đặc trưng của vùng cao nguyên. Trong suốt hành trình, du khách sẽ được tham quan các địa danh nổi tiếng như hồ Xuân Hương – trái tim của thành phố, quảng trường Lâm Viên với biểu tượng nụ hoa Atiso độc đáo, thung lũng Tình Yêu lãng mạn và vườn hoa thành phố rực rỡ sắc màu. 
Ngày tiếp theo, hành trình đưa du khách khám phá đồi chè Cầu Đất – nơi có thể săn mây vào buổi sáng sớm, mang lại trải nghiệm vô cùng ấn tượng. Tiếp tục là thác Datanla, nơi du khách có thể trải nghiệm máng trượt hiện đại xuyên rừng đầy thú vị. Ngoài ra, chương trình còn bao gồm tham quan chùa Linh Phước với kiến trúc khảm sành đặc sắc, mang giá trị tâm linh sâu sắc.
Không chỉ dừng lại ở cảnh đẹp, du khách còn có cơ hội thưởng thức ẩm thực địa phương phong phú như bánh tráng nướng, lẩu gà lá é, sữa đậu nành nóng vào buổi tối tại chợ đêm Đà Lạt. Tour phù hợp cho cặp đôi, gia đình và nhóm bạn muốn nghỉ dưỡng, thư giãn và tận hưởng không gian yên tĩnh.' ,

'Đà Lạt','Miền Nam','3 ngày 2 đêm',3200000,2200000),

('Tour Đà Nẵng - Hội An - Bà Nà Hills 3N2Đ','tour-da-nang-hoi-an-ba-na',
'Tour Đà Nẵng - Hội An - Bà Nà Hills 3 ngày 2 đêm là hành trình kết hợp hoàn hảo giữa du lịch nghỉ dưỡng, khám phá văn hóa và trải nghiệm giải trí hiện đại. Tại Đà Nẵng, du khách sẽ được tham quan những công trình biểu tượng như cầu Rồng, cầu Tình Yêu và tận hưởng bãi biển Mỹ Khê – một trong những bãi biển đẹp nhất hành tinh.
Điểm nhấn đặc biệt của tour là chuyến tham quan Bà Nà Hills, nơi du khách sẽ được trải nghiệm hệ thống cáp treo đạt nhiều kỷ lục thế giới, check-in Cầu Vàng nổi tiếng với kiến trúc độc đáo, tham quan làng Pháp cổ kính và tham gia các trò chơi tại Fantasy Park.
Hành trình tiếp tục với phố cổ Hội An – di sản văn hóa thế giới, nơi du khách sẽ được dạo bước trên những con phố đèn lồng lung linh, tham quan chùa Cầu, nhà cổ và thưởng thức các món đặc sản như cao lầu, mì Quảng. Tour phù hợp cho du khách muốn khám phá miền Trung một cách trọn vẹn trong thời gian ngắn.' ,

'Đà Nẵng - Hội An - Bà Nà Hills','Miền Trung','3 ngày 2 đêm',3000000,2000000),

('Tour Hà Nội - Hạ Long 2N1Đ','tour-ha-noi-ha-long',
'Chương trình du lịch Hà Nội - Hạ Long 2 ngày 1 đêm mang đến cho du khách cơ hội khám phá một trong những kỳ quan thiên nhiên thế giới được UNESCO công nhận. Khởi hành từ Hà Nội, du khách sẽ di chuyển bằng xe du lịch tiện nghi đến Hạ Long, chiêm ngưỡng phong cảnh thiên nhiên thay đổi từ đồng bằng đến vùng biển.
Tại Hạ Long, du khách sẽ lên du thuyền cao cấp, thưởng thức bữa trưa với các món hải sản tươi ngon trong khi tàu di chuyển qua hàng nghìn hòn đảo đá vôi kỳ vĩ. Hành trình bao gồm tham quan hang Sửng Sốt, chèo kayak hoặc đi thuyền nan khám phá hang Luồn và tắm biển tại đảo Titop.
Buổi tối, du khách có thể tham gia các hoạt động trên tàu như câu mực đêm, giao lưu hoặc thư giãn. Sáng hôm sau, du khách thức dậy sớm ngắm bình minh trên vịnh, tham gia lớp tập thể dục nhẹ trước khi quay về Hà Nội. Đây là tour phù hợp cho du khách yêu thích thiên nhiên và muốn trải nghiệm du thuyền.' ,

' Hà Nội - Hạ Long','Miền Bắc','2 ngày 1 đêm',2500000,1800000),

('Tour Nha Trang 4N3Đ','tour-nha-trang',
'Tour Nha Trang 4 ngày 3 đêm là hành trình nghỉ dưỡng biển cao cấp kết hợp vui chơi giải trí. Du khách sẽ được tận hưởng không khí trong lành, làn nước biển xanh trong và bãi cát trắng mịn. Chương trình bao gồm tham quan VinWonders với hàng loạt trò chơi hấp dẫn, công viên nước và thủy cung hiện đại.
Ngoài ra, du khách còn được tham gia tour đảo, trải nghiệm lặn biển ngắm san hô, câu cá và thưởng thức hải sản tươi sống ngay trên bè. Buổi tối là thời gian tự do khám phá chợ đêm Nha Trang và thưởng thức các món đặc sản địa phương.' ,

'Nha Trang','Miền Trung','4 ngày 3 đêm',4500000,3200000),

('Tour Phú Quốc 4N3Đ','tour-phu-quoc',
'Tour Phú Quốc 4 ngày 3 đêm đưa du khách đến với thiên đường nghỉ dưỡng biển đảo. Du khách sẽ được nghỉ tại resort cao cấp, tận hưởng không gian yên bình và dịch vụ chất lượng. Điểm nhấn của chương trình là trải nghiệm cáp treo vượt biển dài nhất thế giới đến Hòn Thơm.
Ngoài ra, du khách còn có cơ hội tham gia lặn biển ngắm san hô, tham quan làng chài, nhà thùng nước mắm và thưởng thức hải sản tươi ngon. Đây là tour lý tưởng cho gia đình và cặp đôi.' ,

'Phú Quốc','Miền Nam','4 ngày 3 đêm',5200000,3600000),

('Tour Hà Nội - Sapa - Fansipan 3N2Đ','tour-ha-noi-sapa-fansipan',
'Tour Hà Nội - Sapa - Fansipan 3 ngày 2 đêm là hành trình khám phá vẻ đẹp hùng vĩ của núi rừng Tây Bắc. Du khách sẽ được chiêm ngưỡng ruộng bậc thang tuyệt đẹp, tham quan bản Cát Cát và tìm hiểu văn hóa dân tộc.
Điểm nổi bật là hành trình chinh phục đỉnh Fansipan bằng cáp treo hiện đại, nơi du khách có thể ngắm toàn cảnh núi rừng từ trên cao. Tour mang đến trải nghiệm thiên nhiên và văn hóa độc đáo.' ,

'Hà Nội - Sapa - Fansipan','Miền Bắc','3 ngày 2 đêm',3100000,2100000),

('Tour Huế - Động Phong Nha 3N2Đ','tour-hue-phong-nha',
'Tour Huế - Động Phong Nha 3 ngày 2 đêm kết hợp giữa khám phá di sản văn hóa và thiên nhiên. Du khách sẽ tham quan Đại Nội, chùa Thiên Mụ và các lăng tẩm vua Nguyễn.
Tiếp đó, hành trình đưa du khách đến Quảng Bình để khám phá động Phong Nha với hệ thống thạch nhũ kỳ ảo, được mệnh danh là một trong những hang động đẹp nhất thế giới.' ,

'Huế - Động Phong Nha','Miền Trung','3 ngày 2 đêm',2800000,1900000),

('Tour Ninh Bình - Tràng An - Tam Cốc 2N1Đ','tour-ninh-binh-trang-an-tam-coc',
'Tour Ninh Bình 2 ngày 1 đêm là hành trình khám phá vùng đất được ví như "Hạ Long trên cạn". Du khách sẽ được trải nghiệm ngồi thuyền tham quan Tràng An, chiêm ngưỡng hệ thống hang động và núi đá vôi hùng vĩ.
Ngoài ra, hành trình còn bao gồm tham quan Tam Cốc – Bích Động và chùa Bái Đính, nơi có nhiều kỷ lục về kiến trúc Phật giáo.' ,

'Ninh Bình - Tràng An - Tam Cốc','Miền Bắc','2 ngày 1 đêm',2200000,1500000);


-- =========================
-- 3. TOUR IMAGES
-- =========================
INSERT INTO tour_images (tour_id) VALUES
(1),(1),(1),(1),(1),
(2),(2),(2),(2),(2),
(3),(3),(3),(3),(3),
(4),(4),(4),(4),(4),
(5),(5),(5),(5),(5),
(6),(6),(6),(6),(6),
(7),(7),(7),(7),(7),
(8),(8),(8),(8),(8);

INSERT INTO tour_itineraries (tour_id,day_number,description) VALUES

-- ================= ĐÀ LẠT =================
(1,1,'NGÀY 01: ĐÓN KHÁCH – THAM QUAN ĐÀ LẠT (Ăn tối)
Sáng/Trưa: Xe và hướng dẫn viên đón quý khách tại sân bay/bến xe Đà Lạt, đưa về khách sạn làm thủ tục nhận phòng. Nghỉ ngơi.
Chiều (14:00): Tham quan Hồ Xuân Hương – biểu tượng của thành phố, tiếp tục check-in tại Quảng trường Lâm Viên với công trình kiến trúc độc đáo.
16:00: Tham quan Thung lũng Tình Yêu và Vườn hoa Thành phố với hàng trăm loài hoa đặc trưng của Đà Lạt.
Tối (18:30): Dùng bữa tối tại nhà hàng. Sau đó tự do khám phá chợ đêm Đà Lạt, thưởng thức đặc sản địa phương.'),

(1,2,'NGÀY 02: ĐÀ LẠT – ĐỒI CHÈ – THÁC DATANLA (Ăn sáng, trưa)
05:30: Khởi hành đi Đồi chè Cầu Đất, săn mây và đón bình minh.
08:00: Dùng bữa sáng. Trở về trung tâm thành phố.
10:00: Tham quan Thác Datanla, trải nghiệm máng trượt xuyên rừng hiện đại.
14:00: Tham quan Chùa Linh Phước (Chùa Ve Chai) với kiến trúc khảm sành độc đáo.
Tối: Tự do nghỉ ngơi hoặc khám phá thành phố về đêm.'),

(1,3,'NGÀY 03: ĐÀ LẠT – TIỄN KHÁCH (Ăn sáng)
07:00: Dùng bữa sáng tại khách sạn.
08:30: Tham quan Chợ Đà Lạt, mua sắm đặc sản.
10:30: Làm thủ tục trả phòng, xe đưa quý khách ra sân bay/bến xe. Kết thúc chương trình.'),


-- ================= ĐÀ NẴNG - HỘI AN - BÀ NÀ =================
(2,1,'NGÀY 01: ĐÀ NẴNG – CITY TOUR (Ăn tối)
Sáng/Trưa: Xe đón quý khách tại sân bay Đà Nẵng, đưa về khách sạn nhận phòng nghỉ ngơi.
Chiều (15:00): Tham quan Cầu Rồng, Cầu Tình Yêu, chụp hình check-in tại các điểm nổi bật của thành phố.
16:30: Tắm biển Mỹ Khê – một trong những bãi biển đẹp nhất hành tinh.
Tối (18:30): Dùng bữa tối tại nhà hàng. Sau đó tự do khám phá Đà Nẵng về đêm, dạo phố hoặc thưởng thức ẩm thực địa phương.'),

(2,2,'NGÀY 02: BÀ NÀ HILLS – CẦU VÀNG (Ăn sáng, trưa)
07:30: Dùng bữa sáng tại khách sạn, khởi hành đi Bà Nà Hills.
09:00: Trải nghiệm hệ thống cáp treo đạt kỷ lục thế giới, tham quan Cầu Vàng nổi tiếng.
10:30: Tham quan vườn hoa Le Jardin, hầm rượu Debay và Làng Pháp.
12:00: Dùng bữa trưa buffet tại nhà hàng trên đỉnh Bà Nà.
14:00: Tham gia các trò chơi tại Fantasy Park.
16:30: Xuống cáp treo, trở về khách sạn nghỉ ngơi.
Tối: Tự do khám phá thành phố.'),

(2,3,'NGÀY 03: HỘI AN – TIỄN KHÁCH (Ăn sáng)
07:30: Dùng bữa sáng, làm thủ tục trả phòng.
08:30: Di chuyển đến phố cổ Hội An.
09:30: Tham quan Chùa Cầu, nhà cổ Tấn Ký, hội quán Phúc Kiến.
11:30: Tự do mua sắm và thưởng thức ẩm thực.
13:30: Xe đưa quý khách ra sân bay. Kết thúc chương trình.'),


-- ================= HÀ NỘI - HẠ LONG =================
(3,1,'NGÀY 01: HÀ NỘI – HẠ LONG (Ăn trưa, tối)
07:30: Xe đón quý khách tại Hà Nội, khởi hành đi Hạ Long.
11:30: Đến cảng, làm thủ tục lên du thuyền, nhận phòng.
12:30: Dùng bữa trưa trên tàu với các món hải sản đặc trưng.
14:00: Tham quan Hang Sửng Sốt – hang động đẹp nhất vịnh Hạ Long.
15:30: Chèo kayak hoặc tham quan Hang Luồn.
16:30: Tắm biển và leo núi tại đảo Titop.
19:00: Dùng bữa tối trên tàu, tham gia câu mực đêm.'),

(3,2,'NGÀY 02: HẠ LONG – HÀ NỘI (Ăn sáng, trưa)
06:00: Ngắm bình minh, tập thể dục trên boong tàu.
07:00: Dùng bữa sáng nhẹ.
08:30: Tham quan thêm các điểm trên vịnh.
09:30: Trả phòng.
11:00: Dùng bữa trưa.
12:00: Quay về Hà Nội. Kết thúc tour.'),


-- ================= NHA TRANG =================
(4,1,'NGÀY 01: ĐÓN KHÁCH – TỰ DO (Ăn tối)
Sáng/Trưa: Đón quý khách tại sân bay Cam Ranh, đưa về khách sạn nhận phòng.
Chiều (15:00): Tự do tắm biển, tham quan quảng trường Nha Trang.
Tối (18:30): Dùng bữa tối, tự do khám phá chợ đêm.'),

(4,2,'NGÀY 02: VINWONDERS (Ăn sáng, trưa)
07:30: Dùng bữa sáng, khởi hành đi VinWonders.
09:00: Trải nghiệm cáp treo vượt biển.
10:00: Vui chơi tại công viên nước và khu trò chơi.
12:00: Ăn trưa.
14:00: Tiếp tục khám phá khu vui chơi.
17:00: Trở về khách sạn.'),

(4,3,'NGÀY 03: TOUR ĐẢO (Ăn sáng, trưa)
08:00: Khởi hành tham quan các đảo.
10:00: Lặn biển ngắm san hô.
12:00: Ăn trưa hải sản.
15:00: Trở về khách sạn nghỉ ngơi.'),

(4,4,'NGÀY 04: TIỄN KHÁCH (Ăn sáng)
07:00: Dùng bữa sáng.
09:00: Trả phòng, tiễn sân bay.'),


-- ================= PHÚ QUỐC =================
(5,1,'NGÀY 01: ĐÓN KHÁCH – KHÁM PHÁ PHÚ QUỐC (Ăn tối)
Sáng/Trưa: Xe và hướng dẫn viên đón quý khách tại sân bay Phú Quốc, đưa về khách sạn/resort làm thủ tục nhận phòng. Nghỉ ngơi, thư giãn sau chuyến bay.
Chiều (15:00): Tự do tắm biển tại bãi biển riêng của resort, tận hưởng không gian trong lành và cảnh biển tuyệt đẹp của đảo ngọc.
16:30: Tham quan Dinh Cậu – địa điểm tâm linh nổi tiếng, ngắm hoàng hôn trên biển.
Tối (18:30): Dùng bữa tối tại nhà hàng với các món hải sản tươi sống.
20:00: Tự do khám phá chợ đêm Phú Quốc, thưởng thức đặc sản như hải sản nướng, kem cuộn, nước mắm Phú Quốc.'),

(5,2,'NGÀY 02: CÁP TREO HÒN THƠM – VUI CHƠI BIỂN (Ăn sáng, trưa)
07:00: Dùng bữa sáng tại khách sạn.
08:00: Xe đưa quý khách đến ga cáp treo An Thới.
08:30: Trải nghiệm tuyến cáp treo vượt biển dài nhất thế giới đến Hòn Thơm, ngắm toàn cảnh quần đảo An Thới từ trên cao.
09:30: Tự do tắm biển, vui chơi tại công viên nước Aquatopia Water Park với nhiều trò chơi hấp dẫn.
12:00: Dùng bữa trưa buffet tại nhà hàng trên đảo.
14:00: Tiếp tục tham gia các hoạt động giải trí, nghỉ ngơi.
16:00: Quay trở lại đất liền bằng cáp treo.
Tối: Tự do ăn tối và khám phá Phú Quốc về đêm.'),

(5,3,'NGÀY 03: KHÁM PHÁ NAM ĐẢO – LẶN BIỂN (Ăn sáng, trưa)
07:30: Dùng bữa sáng tại khách sạn.
08:30: Khởi hành tham quan Nam Đảo.
09:30: Tham quan cơ sở nuôi cấy ngọc trai, tìm hiểu quy trình sản xuất.
10:30: Di chuyển ra đảo, tham gia lặn biển ngắm san hô, trải nghiệm câu cá.
12:30: Dùng bữa trưa trên tàu hoặc tại nhà hàng với hải sản tươi sống.
14:30: Tham quan nhà thùng nước mắm Phú Quốc, tìm hiểu nghề truyền thống lâu đời.
16:00: Trở về khách sạn nghỉ ngơi.
Tối (18:30): Tự do ăn tối, khám phá chợ đêm hoặc dạo biển.'),

(5,4,'NGÀY 04: PHÚ QUỐC – TIỄN KHÁCH (Ăn sáng)
07:00: Dùng bữa sáng tại khách sạn.
08:00: Tự do nghỉ dưỡng, tắm biển hoặc mua sắm đặc sản.
10:00: Làm thủ tục trả phòng.
Xe đưa quý khách ra sân bay Phú Quốc, kết thúc chương trình.');

-- ================= SAPA =================
(6,1,'NGÀY 01: HÀ NỘI – SAPA – BẢN CÁT CÁT (Ăn trưa, tối)
06:30: Xe và hướng dẫn viên đón quý khách tại điểm hẹn ở Hà Nội, khởi hành đi Sapa theo đường cao tốc Nội Bài – Lào Cai.
09:30: Dừng chân nghỉ ngơi tại trạm dừng, thư giãn và dùng nhẹ.
12:30: Đến Sapa, dùng bữa trưa tại nhà hàng địa phương với các món đặc sản vùng núi.
14:00: Nhận phòng khách sạn, nghỉ ngơi.
15:30: Khởi hành tham quan bản Cát Cát – nơi sinh sống của người H’Mông, tìm hiểu đời sống văn hóa, phong tục tập quán.
17:30: Trở về khách sạn nghỉ ngơi.
18:30: Dùng bữa tối tại nhà hàng.
Tối: Tự do khám phá thị trấn Sapa, tham quan nhà thờ đá, thưởng thức các món nướng đặc trưng vùng cao.'),

(6,2,'NGÀY 02: CHINH PHỤC FANSIPAN (Ăn sáng, trưa)
07:00: Dùng bữa sáng tại khách sạn.
08:00: Khởi hành đến ga cáp treo Fansipan.
08:30: Trải nghiệm tuyến cáp treo đạt kỷ lục thế giới, chinh phục đỉnh Fansipan – “Nóc nhà Đông Dương”.
10:30: Tham quan quần thể tâm linh trên đỉnh núi, chụp hình lưu niệm.
12:00: Trở xuống và dùng bữa trưa tại nhà hàng.
14:00: Tự do nghỉ ngơi hoặc khám phá Sapa như chợ Sapa, quảng trường trung tâm.
18:30: Dùng bữa tối tự túc, thưởng thức đặc sản địa phương.
Tối: Nghỉ đêm tại Sapa.'),

(6,3,'NGÀY 03: SAPA – HÀ NỘI (Ăn sáng)
07:00: Dùng bữa sáng tại khách sạn.
08:00: Tự do tham quan chợ Sapa, mua sắm đặc sản địa phương như thổ cẩm, nông sản.
10:00: Làm thủ tục trả phòng.
10:30: Khởi hành về Hà Nội.
13:30: Dừng chân nghỉ ngơi, ăn trưa tự túc trên đường.
16:30: Về đến Hà Nội, kết thúc chương trình.'),


-- ================= HUẾ =================
(7,1,'NGÀY 01: ĐÓN KHÁCH – THAM QUAN CỐ ĐÔ HUẾ (Ăn trưa, tối)
Sáng: Xe đón quý khách tại sân bay/ga Huế, đưa về trung tâm thành phố.
11:30: Dùng bữa trưa tại nhà hàng với các món đặc sản Huế.
13:30: Nhận phòng khách sạn nghỉ ngơi.
15:00: Tham quan Đại Nội Huế – Hoàng thành triều Nguyễn, tìm hiểu lịch sử và kiến trúc cung đình.
17:30: Trở về khách sạn nghỉ ngơi.
18:30: Dùng bữa tối.
Tối: Tự do dạo phố, thưởng thức ẩm thực Huế hoặc tham gia chương trình nghe ca Huế trên sông Hương.'),

(7,2,'NGÀY 02: HUẾ – PHONG NHA (Ăn sáng, trưa)
06:30: Dùng bữa sáng tại khách sạn.
07:30: Khởi hành đi Phong Nha – Kẻ Bàng.
11:30: Dùng bữa trưa tại nhà hàng địa phương.
13:00: Tham quan động Phong Nha bằng thuyền, chiêm ngưỡng hệ thống hang động kỳ vĩ.
16:30: Khởi hành về Huế.
19:30: Về đến Huế, nghỉ ngơi, ăn tối tự túc.'),

(7,3,'NGÀY 03: HUẾ – TIỄN KHÁCH (Ăn sáng)
07:00: Dùng bữa sáng tại khách sạn.
08:00: Tham quan Chùa Thiên Mụ – biểu tượng tâm linh của Huế.
09:30: Tham quan chợ Đông Ba, mua đặc sản.
11:00: Trả phòng khách sạn.
Xe đưa quý khách ra sân bay/ga Huế. Kết thúc chương trình.'),


-- ================= NINH BÌNH =================
(8,1,'NGÀY 01: HÀ NỘI – TRÀNG AN (Ăn trưa)
07:30: Xe đón quý khách tại Hà Nội, khởi hành đi Ninh Bình.
09:30: Đến Ninh Bình, nghỉ ngơi.
10:00: Tham quan khu du lịch Tràng An bằng thuyền, chiêm ngưỡng cảnh sắc non nước hữu tình.
12:30: Dùng bữa trưa tại nhà hàng với các món đặc sản như dê núi, cơm cháy.
14:00: Tham quan chùa Bái Đính – quần thể chùa lớn nhất Việt Nam.
17:00: Nhận phòng khách sạn, nghỉ ngơi.
18:30: Dùng bữa tối.
Tối: Tự do nghỉ ngơi hoặc khám phá Ninh Bình về đêm.'),

(8,2,'NGÀY 02: TAM CỐC – HÀ NỘI (Ăn sáng, trưa)
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

(9,5,'TP.HCM','2026-05-05',800000,500000,30,25),
(10,5,'Hà Nội','2026-05-15',1500000,1000000,30,27),

(11,6,'Hà Nội','2026-05-10',400000,200000,25,20),
(12,6,'TP.HCM','2026-05-20',1200000,800000,25,22),

(13,7,'Huế','2026-04-12',200000,100000,25,20),
(14,7,'Đà Nẵng','2026-04-25',400000,200000,25,23),

(15,8,'Hà Nội','2026-04-18',150000,80000,30,27),
(16,8,'TP.HCM','2026-05-02',900000,600000,30,28);


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
'Bảo hiểm du lịch trọn gói, đảm bảo quyền lợi cho khách trong suốt thời gian tham gia tour.'),


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
(8,1),(8,2),(8,3),(8,4),


-- =========================
-- 8. BOOKINGS (logic giá chuẩn)
-- =========================
INSERT INTO bookings 
(user_id,departure_id,adults,children,total_price,payment_status,status,contact_name,contact_phone,contact_email) VALUES

(4,1,2,1, (2*3200000 + 1*2200000 + 2*500000 + 1*300000),'paid','confirmed','Phạm Minh Tuấn','0978123456','tuan@gmail.com'),

(5,3,1,1, (1*3000000 + 1*2000000 + 1*200000 + 1*100000),'paid','confirmed','Đỗ Thị Ngọc Anh','0967123456','ngocanh@gmail.com'),

(6,5,2,0, (2*2500000 + 2*300000),'pending','pending','Võ Hoàng Nam','0945123789','nam@gmail.com'),

(7,9,2,1, (2*5200000 + 1*3600000 + 2*800000 + 1*500000),'paid','confirmed','Bùi Thanh Trúc','0923456789','truc@gmail.com'),

(8,11,1,0, (1*3100000 + 1*400000),'paid','confirmed','Nguyễn Thị Hồng Nhung','0398765432','nhung@gmail.com');


-- =========================
-- 9. REVIEWS (chi tiết hơn)
-- =========================
INSERT INTO reviews (user_id,tour_id,rating,comment) VALUES

(4,1,5,'Tour Đà Lạt rất tuyệt vời, lịch trình hợp lý, hướng dẫn viên nhiệt tình, khách sạn sạch sẽ. Trải nghiệm săn mây và tham quan thác rất đáng nhớ.'),

(5,2,4,'Tour Đà Nẵng – Hội An khá tốt, đặc biệt ấn tượng với Bà Nà Hills và Cầu Vàng. Dịch vụ ổn, sẽ quay lại.'),

(6,3,5,'Hạ Long quá đẹp, du thuyền sang trọng, đồ ăn ngon. Đây là chuyến đi đáng nhớ nhất của tôi.'),

(7,5,5,'Phú Quốc rất đẹp, biển trong xanh, dịch vụ resort tốt. Trải nghiệm cáp treo Hòn Thơm rất ấn tượng.'),

(8,6,4,'Sapa mát mẻ, cảnh đẹp, Fansipan rất hùng vĩ. Tuy nhiên thời tiết hơi lạnh nhưng vẫn rất đáng trải nghiệm.'),


-- =========================
-- 10. WISHLIST (hợp lý theo user)
-- =========================
INSERT INTO wishlist (user_id,tour_id) VALUES

(4,5),
(4,4),
(5,1),
(6,2),
(7,3),
(8,8);