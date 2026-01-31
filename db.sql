-- CREATE DATABASE
CREATE DATABASE IF NOT EXISTS db_viet_tour
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE db_viet_tour;

-- 1. USERS
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    fullname VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,

    role ENUM('customer','admin') NOT NULL DEFAULT 'customer',
    status TINYINT(1) NOT NULL DEFAULT 1 CHECK (status IN (0,1)),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. TOURS
CREATE TABLE tours (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    description TEXT,

    location VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    duration VARCHAR(100) NOT NULL,

    price_default DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    price_child DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    cover_image VARCHAR(255) DEFAULT NULL, -- default là null

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. TOUR IMAGES
CREATE TABLE tour_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tour_id INT NOT NULL,
    image VARCHAR(255) DEFAULT NULL, -- default là null

    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE
);

-- 4. TOUR ITINERARIES
CREATE TABLE tour_itineraries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tour_id INT NOT NULL,
    day_number INT NOT NULL CHECK (day_number > 0),
    description TEXT,

    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
    UNIQUE KEY uk_tour_day (tour_id, day_number)
);

-- 5. TOUR DEPARTURES
CREATE TABLE tour_departures (
    id INT AUTO_INCREMENT PRIMARY KEY,

    tour_id INT NOT NULL,
    departure_location VARCHAR(100) NOT NULL,
    departure_date DATE NOT NULL,

    price_moving DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    price_moving_child DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    seats_total INT NOT NULL DEFAULT 1,
    seats_available INT NOT NULL DEFAULT 1,

    status ENUM('open','closed','full') DEFAULT 'open',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
    UNIQUE KEY uk_tour_date (tour_id, departure_date)
);

-- 6. SERVICES
CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    description TEXT,

    status TINYINT(1) DEFAULT 1 CHECK (status IN (0,1)),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7. TOUR - SERVICES (MANY TO MANY)
CREATE TABLE tour_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tour_id INT NOT NULL,
    service_id INT NOT NULL,

    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,

    UNIQUE KEY uk_tour_service (tour_id, service_id)
);

-- 8. BOOKINGS
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NULL,
    departure_id INT NOT NULL,

    adults INT NOT NULL DEFAULT 1 CHECK (adults > 0),
    children INT NOT NULL DEFAULT 0 CHECK (children >= 0),

    total_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    payment_status ENUM('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
    status ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',

    contact_name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    note TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (departure_id) REFERENCES tour_departures(id) ON DELETE RESTRICT
);

-- 9. REVIEWS
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,
    tour_id INT NOT NULL,

    rating TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,

    UNIQUE KEY uk_user_tour_review (user_id, tour_id)
);

-- 10. WISHLIST
CREATE TABLE wishlist (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,
    tour_id INT NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,

    UNIQUE KEY uk_wishlist (user_id, tour_id)
);
