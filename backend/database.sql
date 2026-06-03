DROP DATABASE IF EXISTS `real_estate_db`;
CREATE DATABASE `real_estate_db`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `real_estate_db`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ==========================================
-- 1. Authentication & Users
-- ==========================================
CREATE TABLE `users` (
  `user_id`       INT          NOT NULL AUTO_INCREMENT,
  `email`         VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name`     VARCHAR(150) DEFAULT NULL,
  `phone`         VARCHAR(20)  DEFAULT NULL,
  `avatar_url`    TEXT         DEFAULT NULL,
  `role`          ENUM('user','admin') NOT NULL DEFAULT 'user',
  `is_verified`   TINYINT(1)   NOT NULL DEFAULT 0,
  `is_active`     TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `otp_tokens` (
  `token_id`   INT         NOT NULL AUTO_INCREMENT,
  `user_id`    INT         NOT NULL,
  `token`      VARCHAR(10) NOT NULL,
  `purpose`    ENUM('email_verify','password_reset') NOT NULL,
  `is_used`    TINYINT(1)  DEFAULT 0,
  `expires_at` TIMESTAMP   NOT NULL,
  `created_at` TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`token_id`),
  KEY `idx_otp_user`  (`user_id`),
  KEY `idx_otp_token` (`token`),
  CONSTRAINT `fk_otp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `user_preferences` (
  `pref_id`            INT         NOT NULL AUTO_INCREMENT,
  `user_id`            INT         DEFAULT NULL,
  `preferred_currency` VARCHAR(10) DEFAULT 'USD',
  `behavior_data`      JSON        DEFAULT NULL,
  `updated_at`         TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`pref_id`),
  UNIQUE KEY `uq_pref_user` (`user_id`),
  CONSTRAINT `fk_pref_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 2. Master Data
-- ==========================================
CREATE TABLE `cities` (
  `city_id`   INT          NOT NULL AUTO_INCREMENT,
  `name`      VARCHAR(150) NOT NULL,
  `country`   VARCHAR(100) DEFAULT 'Vietnam',
  `is_active` TINYINT(1)   DEFAULT 1,
  PRIMARY KEY (`city_id`),
  UNIQUE KEY `uq_cities_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `districts` (
  `district_id` INT          NOT NULL AUTO_INCREMENT,
  `city_id`     INT          NOT NULL,
  `name`        VARCHAR(150) NOT NULL,
  `zipcode`     VARCHAR(20)  DEFAULT NULL,
  `is_active`   TINYINT(1)   DEFAULT 1,
  PRIMARY KEY (`district_id`),
  UNIQUE KEY `uq_district_city_name` (`city_id`, `name`),
  CONSTRAINT `fk_district_city` FOREIGN KEY (`city_id`) REFERENCES `cities` (`city_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `property_types` (
  `type_id`   INT          NOT NULL AUTO_INCREMENT,
  `parent_id` INT          DEFAULT NULL,
  `name`      VARCHAR(100) NOT NULL,
  `is_active` TINYINT(1)   DEFAULT 1,
  PRIMARY KEY (`type_id`),
  UNIQUE KEY `uq_type_name` (`name`),
  CONSTRAINT `fk_type_parent` FOREIGN KEY (`parent_id`) REFERENCES `property_types` (`type_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `features` (
  `feature_id` INT          NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(150) NOT NULL,
  `icon_name`  VARCHAR(50)  DEFAULT NULL,
  PRIMARY KEY (`feature_id`),
  UNIQUE KEY `uq_feature_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 3. Core Properties & Media
-- ==========================================
CREATE TABLE `properties` (
  `property_id`    INT            NOT NULL AUTO_INCREMENT,
  `owner_id`       INT            NOT NULL,
  `type_id`        INT            NOT NULL,
  `district_id`    INT            DEFAULT NULL,
  `title`          VARCHAR(300)   NOT NULL,
  `slug`           VARCHAR(255)   DEFAULT NULL,
  `description`    TEXT           DEFAULT NULL,
  `listing_type`   ENUM('sale','rent') NOT NULL,
  `address`        TEXT           DEFAULT NULL,
  `latitude`       DECIMAL(10,8)  DEFAULT NULL,
  `longitude`      DECIMAL(11,8)  DEFAULT NULL,
  `price_usd`      DECIMAL(18,2)  NOT NULL,
  `area_m2`        DECIMAL(10,2)  DEFAULT NULL,
  `bedrooms`       SMALLINT       DEFAULT NULL,
  `bathrooms`      SMALLINT       DEFAULT NULL,
  `direction`      ENUM('north','south','east','west','northeast','northwest','southeast','southwest') DEFAULT NULL,
  `video_url`      TEXT           DEFAULT NULL,
  `mod_status`     ENUM('pending','approved','rejected') DEFAULT 'pending',
  `listing_status` ENUM('active','negotiating','deposited','sold','rented','hidden') DEFAULT 'active',
  `vip_tier`       ENUM('none','silver','gold') NOT NULL DEFAULT 'none',
  `vip_expires_at` TIMESTAMP      NULL DEFAULT NULL,
  `expires_at`     TIMESTAMP      NULL DEFAULT NULL,
  `created_at`     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`property_id`),
  UNIQUE KEY `uq_prop_slug` (`slug`),
  KEY `idx_prop_owner`          (`owner_id`),
  KEY `idx_prop_district`       (`district_id`),
  KEY `idx_prop_price_area`     (`price_usd`, `area_m2`),
  KEY `idx_prop_type_district`  (`type_id`, `district_id`),
  KEY `idx_prop_status`         (`mod_status`, `listing_status`),
  KEY `idx_prop_rooms`          (`bedrooms`, `bathrooms`),
  KEY `idx_prop_vip`            (`vip_tier`),
  FULLTEXT KEY `idx_prop_fts`   (`title`, `description`),
  CONSTRAINT `fk_prop_owner`    FOREIGN KEY (`owner_id`)    REFERENCES `users`          (`user_id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_prop_type`     FOREIGN KEY (`type_id`)     REFERENCES `property_types` (`type_id`),
  CONSTRAINT `fk_prop_district` FOREIGN KEY (`district_id`) REFERENCES `districts`      (`district_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `property_images` (
  `image_id`    INT       NOT NULL AUTO_INCREMENT,
  `property_id` INT       NOT NULL,
  `image_url`   TEXT      NOT NULL,
  `sort_order`  SMALLINT  DEFAULT 0,
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`image_id`),
  KEY `idx_pimg_property` (`property_id`),
  CONSTRAINT `fk_pimg_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`property_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `property_features` (
  `property_id` INT NOT NULL,
  `feature_id`  INT NOT NULL,
  PRIMARY KEY (`property_id`, `feature_id`),
  CONSTRAINT `fk_pf_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`property_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pf_feature`  FOREIGN KEY (`feature_id`)  REFERENCES `features`   (`feature_id`)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `price_history` (
  `history_id`   INT           NOT NULL AUTO_INCREMENT,
  `property_id`  INT           NOT NULL,
  `old_price_usd` DECIMAL(18,2) NOT NULL,
  `new_price_usd` DECIMAL(18,2) NOT NULL,
  `changed_at`   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_id`),
  KEY `idx_pricehist_property` (`property_id`),
  CONSTRAINT `fk_pricehist_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`property_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 4. VIP Subscriptions
-- ==========================================
CREATE TABLE `subscriptions` (
  `sub_id`            INT            NOT NULL AUTO_INCREMENT,
  `user_id`           INT            NOT NULL,
  `property_id`       INT            NOT NULL,
  `tier`              ENUM('silver','gold') NOT NULL,
  `stripe_session_id` VARCHAR(255)   NOT NULL,
  `amount_usd`        DECIMAL(8,2)   NOT NULL,
  `status`            ENUM('pending','active','expired') DEFAULT 'pending',
  `created_at`        TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  `expires_at`        TIMESTAMP      NULL DEFAULT NULL,
  PRIMARY KEY (`sub_id`),
  KEY `idx_sub_user`     (`user_id`),
  KEY `idx_sub_property` (`property_id`),
  CONSTRAINT `fk_sub_user` FOREIGN KEY (`user_id`)     REFERENCES `users`       (`user_id`)     ON DELETE CASCADE,
  CONSTRAINT `fk_sub_prop` FOREIGN KEY (`property_id`) REFERENCES `properties`  (`property_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 5. Tracking & Interactions
-- ==========================================
CREATE TABLE `favorites` (
  `favorite_id` INT       NOT NULL AUTO_INCREMENT,
  `user_id`     INT       NOT NULL,
  `property_id` INT       NOT NULL,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`favorite_id`),
  UNIQUE KEY `uq_fav_user_prop` (`user_id`, `property_id`),
  KEY `idx_fav_property` (`property_id`),
  CONSTRAINT `fk_fav_user`     FOREIGN KEY (`user_id`)     REFERENCES `users`      (`user_id`)     ON DELETE CASCADE,
  CONSTRAINT `fk_fav_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`property_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `recently_viewed` (
  `id`          INT       NOT NULL AUTO_INCREMENT,
  `user_id`     INT       NOT NULL,
  `property_id` INT       NOT NULL,
  `viewed_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rv_user_prop` (`user_id`, `property_id`),
  KEY `idx_rv_property` (`property_id`),
  CONSTRAINT `fk_rv_user`     FOREIGN KEY (`user_id`)     REFERENCES `users`      (`user_id`)     ON DELETE CASCADE,
  CONSTRAINT `fk_rv_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`property_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 6. Communications
-- ==========================================
CREATE TABLE `conversations` (
  `conversation_id` INT       NOT NULL AUTO_INCREMENT,
  `property_id`     INT       DEFAULT NULL,
  `buyer_id`        INT       NOT NULL,
  `seller_id`       INT       NOT NULL,
  `last_message_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`conversation_id`),
  UNIQUE KEY `uq_conv_prop_buyer_seller` (`property_id`, `buyer_id`, `seller_id`),
  KEY `idx_conv_buyer`  (`buyer_id`),
  KEY `idx_conv_seller` (`seller_id`),
  CONSTRAINT `fk_conv_property` FOREIGN KEY (`property_id`) REFERENCES `properties`  (`property_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_conv_buyer`    FOREIGN KEY (`buyer_id`)    REFERENCES `users`        (`user_id`)     ON DELETE CASCADE,
  CONSTRAINT `fk_conv_seller`   FOREIGN KEY (`seller_id`)   REFERENCES `users`        (`user_id`)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `messages` (
  `message_id`      INT       NOT NULL AUTO_INCREMENT,
  `conversation_id` INT       NOT NULL,
  `sender_id`       INT       NOT NULL,
  `body`            TEXT      NOT NULL,
  `type`            ENUM('text','image') DEFAULT 'text',
  `is_read`         TINYINT(1) DEFAULT 0,
  `sent_at`         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`message_id`),
  KEY `idx_msg_sender` (`sender_id`),
  KEY `idx_msg_conv`   (`conversation_id`, `sent_at`),
  CONSTRAINT `fk_msg_conv`   FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`conversation_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_msg_sender` FOREIGN KEY (`sender_id`)       REFERENCES `users`         (`user_id`)         ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `notifications` (
  `notification_id` INT          NOT NULL AUTO_INCREMENT,
  `user_id`         INT          NOT NULL,
  `type`            VARCHAR(50)  DEFAULT NULL,
  `title`           VARCHAR(255) DEFAULT NULL,
  `body`            TEXT         DEFAULT NULL,
  `ref_id`          INT          DEFAULT NULL,
  `ref_type`        VARCHAR(50)  DEFAULT NULL,
  `is_read`         TINYINT(1)   DEFAULT 0,
  `created_at`      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `idx_notif_user_read` (`user_id`, `is_read`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 7. Reports & Reviews
-- ==========================================
CREATE TABLE `reports` (
  `report_id`   INT          NOT NULL AUTO_INCREMENT,
  `reporter_id` INT          NOT NULL,
  `property_id` INT          NOT NULL,
  `reason`      VARCHAR(100) DEFAULT NULL,
  `details`     TEXT         DEFAULT NULL,
  `status`      ENUM('pending','reviewed','dismissed') DEFAULT 'pending',
  `created_at`  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`report_id`),
  KEY `idx_report_reporter`  (`reporter_id`),
  KEY `idx_report_property`  (`property_id`),
  CONSTRAINT `fk_report_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `users`       (`user_id`)     ON DELETE CASCADE,
  CONSTRAINT `fk_report_property` FOREIGN KEY (`property_id`) REFERENCES `properties`  (`property_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `reviews` (
  `review_id`   INT       NOT NULL AUTO_INCREMENT,
  `reviewer_id` INT       NOT NULL,
  `reviewee_id` INT       NOT NULL,
  `property_id` INT       DEFAULT NULL,
  `rating`      SMALLINT  NOT NULL,
  `comment`     TEXT      DEFAULT NULL,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  UNIQUE KEY `uq_review` (`reviewer_id`, `reviewee_id`, `property_id`),
  KEY `idx_review_reviewee`  (`reviewee_id`),
  KEY `idx_review_property`  (`property_id`),
  CONSTRAINT `fk_review_reviewer` FOREIGN KEY (`reviewer_id`) REFERENCES `users`       (`user_id`)     ON DELETE CASCADE,
  CONSTRAINT `fk_review_reviewee` FOREIGN KEY (`reviewee_id`) REFERENCES `users`       (`user_id`)     ON DELETE CASCADE,
  CONSTRAINT `fk_review_property` FOREIGN KEY (`property_id`) REFERENCES `properties`  (`property_id`) ON DELETE SET NULL,
  CONSTRAINT `chk_review_rating`  CHECK (`rating` BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 8. System Utilities
-- ==========================================
CREATE TABLE `subscription_packages` (
  `package_id`    INT           NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(100)  NOT NULL,
  `price_usd`     DECIMAL(10,2) NOT NULL,
  `duration_days` INT           NOT NULL DEFAULT 30,
  `is_active`     TINYINT(1)    DEFAULT 1,
  PRIMARY KEY (`package_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `user_subscriptions` (
  `subscription_id` INT          NOT NULL AUTO_INCREMENT,
  `user_id`         INT          NOT NULL,
  `package_id`      INT          NOT NULL,
  `payment_status`  ENUM('pending','completed','failed') DEFAULT 'pending',
  `transaction_ref` VARCHAR(255) DEFAULT NULL,
  `start_date`      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  `end_date`        TIMESTAMP    NULL DEFAULT NULL,
  PRIMARY KEY (`subscription_id`),
  CONSTRAINT `fk_usub_package` FOREIGN KEY (`package_id`) REFERENCES `subscription_packages` (`package_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_usub_user`    FOREIGN KEY (`user_id`)    REFERENCES `users`                 (`user_id`)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `admin_logs` (
  `log_id`      INT          NOT NULL AUTO_INCREMENT,
  `admin_id`    INT          DEFAULT NULL,
  `action`      VARCHAR(100) DEFAULT NULL,
  `target_type` VARCHAR(50)  DEFAULT NULL,
  `target_id`   INT          DEFAULT NULL,
  `note`        TEXT         DEFAULT NULL,
  `created_at`  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_alog_admin` (`admin_id`),
  CONSTRAINT `fk_alog_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `exchange_rates` (
  `currency_code` VARCHAR(10)   NOT NULL,
  `rate_to_usd`   DECIMAL(18,6) NOT NULL,
  `updated_at`    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`currency_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- SEED DATA
-- ==========================================

-- Admin user  (password: admin123)
INSERT INTO `users` (`user_id`, `email`, `password_hash`, `full_name`, `phone`, `role`, `is_verified`, `is_active`) VALUES
(1, 'admin@luxestates.com', '$2a$12$VEPZwKUuc5CRAyNCVl5cHe/T/SSxU6mDcDKHinmNqWMmTe.FaMJIq', 'Super Administrator', '0999999999', 'admin', 1, 1);

INSERT INTO `user_preferences` (`pref_id`, `user_id`, `preferred_currency`, `behavior_data`) VALUES
(1, 1, 'USD', '{"logins": 1}');

-- Cities
INSERT INTO `cities` (`city_id`, `name`, `country`) VALUES
(1, 'Ho Chi Minh City', 'Vietnam'),
(2, 'Hanoi',            'Vietnam'),
(3, 'Da Nang',          'Vietnam');

-- Districts
INSERT INTO `districts` (`district_id`, `city_id`, `name`) VALUES
(1, 1, 'District 1'),
(2, 1, 'District 2'),
(3, 1, 'District 3'),
(4, 1, 'Binh Thanh'),
(5, 1, 'Thu Duc'),
(6, 2, 'Hoan Kiem'),
(7, 2, 'Ba Dinh'),
(8, 2, 'Dong Da'),
(9, 3, 'Hai Chau'),
(10, 3, 'Son Tra');

-- Property types
INSERT INTO `property_types` (`type_id`, `parent_id`, `name`) VALUES
(1, NULL, 'Apartment'),
(2, 1,    'Penthouse'),
(3, 1,    'Studio'),
(4, NULL, 'Villa'),
(5, NULL, 'Townhouse'),
(6, NULL, 'Office'),
(7, NULL, 'Land');

-- Features / amenities
INSERT INTO `features` (`feature_id`, `name`, `icon_name`) VALUES
(1,  'Sea View',       'waves'),
(2,  'Swimming Pool',  'droplets'),
(3,  'Security 24/7',  'shield'),
(4,  'Smart Home',     'cpu'),
(5,  'Gym',            'dumbbell'),
(6,  'Garden',         'trees'),
(7,  'Parking',        'car'),
(8,  'Elevator',       'arrow-up'),
(9,  'Rooftop',        'building-2'),
(10, 'Pet Friendly',   'paw-print');

-- Exchange rates (USD base)
INSERT INTO `exchange_rates` (`currency_code`, `rate_to_usd`) VALUES
('USD', 1.000000),
('VND', 25000.000000),
('EUR', 0.920000);

-- Subscription packages
INSERT INTO `subscription_packages` (`package_id`, `name`, `price_usd`, `duration_days`) VALUES
(1, 'Silver VIP', 9.99,  30),
(2, 'Gold VIP',   29.99, 30);

SET FOREIGN_KEY_CHECKS = 1;

-- FULLTEXT index for keyword search is already defined inline in the CREATE TABLE above (idx_prop_fts)
