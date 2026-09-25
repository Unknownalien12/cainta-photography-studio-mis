-- =============================================================================
-- Cainta Photography Studio Management Information System (MIS)
-- Complete MySQL / MariaDB Database Schema & Seed Script
-- Compatible with XAMPP, MySQL 8.0+, MariaDB 10.4+
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `cainta_studio_mis` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `cainta_studio_mis`;

-- Disable foreign key checks for clean execution during setup
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. Users Table
-- Stores credentials and user profiles (SUPER_ADMIN, STUDIO_ADMIN, CUSTOMER)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` VARCHAR(64) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(30) DEFAULT NULL,
  `role` ENUM('SUPER_ADMIN', 'STUDIO_ADMIN', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER',
  `password` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Studios Table
-- Studio directories and business profiles located in Cainta, Rizal
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `studios`;
CREATE TABLE `studios` (
  `id` VARCHAR(64) NOT NULL,
  `owner_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `address` VARCHAR(255) NOT NULL,
  `barangay` VARCHAR(100) NOT NULL DEFAULT 'San Isidro',
  `contact_number` VARCHAR(30) DEFAULT NULL,
  `email` VARCHAR(150) DEFAULT NULL,
  `opening_hours` TIME NOT NULL DEFAULT '08:00:00',
  `closing_hours` TIME NOT NULL DEFAULT '18:00:00',
  `slot_duration_minutes` INT NOT NULL DEFAULT 60,
  `accepts_gcash` TINYINT(1) NOT NULL DEFAULT 1,
  `qr_code_url` TEXT DEFAULT NULL,
  `rating` DECIMAL(3,2) NOT NULL DEFAULT 5.00,
  `total_reviews` INT NOT NULL DEFAULT 0,
  `cover_image_url` TEXT DEFAULT NULL,
  `logo_url` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_studios_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Packages Table
-- Photo session packages (Self-shoot, Solo Portrait, Graduation, Family, etc.)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `packages`;
CREATE TABLE `packages` (
  `id` VARCHAR(64) NOT NULL,
  `studio_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `duration_minutes` INT NOT NULL DEFAULT 30,
  `description` TEXT DEFAULT NULL,
  `features` JSON DEFAULT NULL,
  `includes_prints` TINYINT(1) NOT NULL DEFAULT 0,
  `is_available` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_packages_studio` FOREIGN KEY (`studio_id`) REFERENCES `studios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Bookings Table
-- Client reservations, scheduling, and payment status tracking
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `bookings`;
CREATE TABLE `bookings` (
  `id` VARCHAR(64) NOT NULL,
  `studio_id` VARCHAR(64) NOT NULL,
  `package_id` VARCHAR(64) NOT NULL,
  `customer_id` VARCHAR(64) NOT NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `customer_email` VARCHAR(150) NOT NULL,
  `customer_phone` VARCHAR(30) DEFAULT NULL,
  `booking_date` DATE NOT NULL,
  `time_slot` VARCHAR(30) NOT NULL,
  `total_amount` DECIMAL(10,2) NOT NULL,
  `paid_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `payment_status` ENUM('UNPAID', 'DOWNPAYMENT_PAID', 'FULLY_PAID', 'REFUNDED') NOT NULL DEFAULT 'UNPAID',
  `booking_status` ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED') NOT NULL DEFAULT 'PENDING',
  `special_requests` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reminder_count` INT NOT NULL DEFAULT 0,
  `last_reminder_sent_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_bookings_date` (`booking_date`),
  INDEX `idx_bookings_status` (`booking_status`),
  CONSTRAINT `fk_bookings_studio` FOREIGN KEY (`studio_id`) REFERENCES `studios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bookings_package` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bookings_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Payments Table
-- Log of GCash / PayMongo / Cash transactions
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` VARCHAR(64) NOT NULL,
  `booking_id` VARCHAR(64) DEFAULT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `payment_type` ENUM('downpayment', 'balance', 'full', 'print_order') NOT NULL,
  `gcash_reference` VARCHAR(100) DEFAULT NULL,
  `paymongo_payment_id` VARCHAR(100) DEFAULT NULL,
  `status` ENUM('PENDING', 'PAID', 'FAILED', 'EXPIRED') NOT NULL DEFAULT 'PAID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_payments_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. Print Orders Table
-- Orders for photo printing, sizes, and photo delivery
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `print_orders`;
CREATE TABLE `print_orders` (
  `id` VARCHAR(64) NOT NULL,
  `studio_id` VARCHAR(64) NOT NULL,
  `customer_id` VARCHAR(64) NOT NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `paper_size` VARCHAR(50) NOT NULL,
  `finish_type` VARCHAR(50) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(10,2) NOT NULL,
  `total_price` DECIMAL(10,2) NOT NULL,
  `photo_url` TEXT DEFAULT NULL,
  `status` ENUM('PENDING', 'PROCESSING', 'PRINTED', 'READY_FOR_PICKUP', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `delivery_address` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_print_orders_studio` FOREIGN KEY (`studio_id`) REFERENCES `studios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_print_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. Studio Customer CRM Table
-- Customer relationships and metrics per studio
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` VARCHAR(64) NOT NULL,
  `studio_id` VARCHAR(64) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(30) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `total_bookings` INT NOT NULL DEFAULT 0,
  `total_spent` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `last_visited` DATE DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_customers_studio` FOREIGN KEY (`studio_id`) REFERENCES `studios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. Promotions Table
-- Studio discount codes and promo banners
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `promotions`;
CREATE TABLE `promotions` (
  `id` VARCHAR(64) NOT NULL,
  `studio_id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `discount_percent` DECIMAL(5,2) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `banner_image_url` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_promotions_studio` FOREIGN KEY (`studio_id`) REFERENCES `studios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. Email Templates Table
-- Automated email notifications and reminders
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `email_templates`;
CREATE TABLE `email_templates` (
  `id` VARCHAR(64) NOT NULL,
  `studio_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `body` TEXT NOT NULL,
  `variables` JSON DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_email_templates_studio` FOREIGN KEY (`studio_id`) REFERENCES `studios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. Payment Reminder Settings Table
-- Studio rules for automated payment reminders
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `payment_reminder_settings`;
CREATE TABLE `payment_reminder_settings` (
  `id` VARCHAR(64) NOT NULL,
  `studio_id` VARCHAR(64) NOT NULL UNIQUE,
  `enable_auto_reminders` TINYINT(1) NOT NULL DEFAULT 1,
  `send_days_before` INT NOT NULL DEFAULT 1,
  `notify_via_sms` TINYINT(1) NOT NULL DEFAULT 0,
  `notify_via_email` TINYINT(1) NOT NULL DEFAULT 1,
  `custom_message` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_reminder_settings_studio` FOREIGN KEY (`studio_id`) REFERENCES `studios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. Inventory Items Table
-- Studio equipment, props, backdrops, and photo paper stock tracking
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `inventory_items`;
CREATE TABLE `inventory_items` (
  `id` VARCHAR(64) NOT NULL,
  `studio_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `category` ENUM('Equipment', 'Prop', 'Backdrop', 'Photo Paper', 'Consumable') NOT NULL DEFAULT 'Equipment',
  `quantity` INT NOT NULL DEFAULT 0,
  `unit` VARCHAR(30) NOT NULL DEFAULT 'pcs',
  `min_threshold` INT NOT NULL DEFAULT 5,
  `cost_per_unit` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK') NOT NULL DEFAULT 'IN_STOCK',
  `last_restocked` DATE DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_inventory_studio` FOREIGN KEY (`studio_id`) REFERENCES `studios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 12. Blockout Dates Table
-- Studio maintenance, holidays, and closed dates
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `blockout_dates`;
CREATE TABLE `blockout_dates` (
  `id` VARCHAR(64) NOT NULL,
  `studio_id` VARCHAR(64) NOT NULL,
  `date` DATE NOT NULL,
  `reason` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_blockout_studio` FOREIGN KEY (`studio_id`) REFERENCES `studios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 13. Notifications Table
-- System alerts and user notifications
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` VARCHAR(64) NOT NULL,
  `recipient_user_id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `type` VARCHAR(50) DEFAULT 'general',
  `link` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`recipient_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 14. Audit Logs Table
-- System security and compliance audit records
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) DEFAULT NULL,
  `user_name` VARCHAR(150) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `target_type` VARCHAR(50) NOT NULL,
  `target_id` VARCHAR(64) DEFAULT NULL,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 15. Custom Pages Table
-- CMS pages managed by Super Admin
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `custom_pages`;
CREATE TABLE `custom_pages` (
  `id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `slug` VARCHAR(200) NOT NULL UNIQUE,
  `content` LONGTEXT NOT NULL,
  `is_published` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enable foreign key checks back
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- SAMPLE INITIAL DATA SEEDING
-- =============================================================================

INSERT INTO `users` (`id`, `full_name`, `email`, `phone`, `role`, `password`, `created_at`) VALUES
('usr_super_admin', 'System Super Admin', 'admin@caintastudios.ph', '09171234567', 'SUPER_ADMIN', '$2a$10$abcdef1234567890abcdef', NOW()),
('usr_lumina_owner', 'Daniel Padilla', 'danielpadilla140600@gmail.com', '09189876543', 'STUDIO_ADMIN', '$2a$10$abcdef1234567890abcdef', NOW()),
('usr_client_maria', 'Maria Santos', 'maria.santos@gmail.com', '09191112233', 'CUSTOMER', '$2a$10$abcdef1234567890abcdef', NOW());

INSERT INTO `studios` (`id`, `owner_id`, `name`, `description`, `address`, `barangay`, `contact_number`, `email`, `opening_hours`, `closing_hours`, `slot_duration_minutes`, `accepts_gcash`, `qr_code_url`, `rating`, `total_reviews`, `cover_image_url`, `logo_url`) VALUES
('std_lumina_cainta', 'usr_lumina_owner', 'Lumina Self-Shoot Studio', 'A modern aesthetic self-shoot and portrait studio located at the heart of Cainta, Rizal. Offering studio lights, professional DSLR setups, and high-quality prints.', '2nd Floor, VVV Building, Imelda Ave, Cainta, Rizal', 'San Isidro', '09189876543', 'danielpadilla140600@gmail.com', '09:00:00', '19:00:00', 30, 1, 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400', 4.90, 128, 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1200', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200');

INSERT INTO `packages` (`id`, `studio_id`, `name`, `category`, `price`, `duration_minutes`, `description`, `features`, `includes_prints`, `is_available`) VALUES
('pkg_solo_express', 'std_lumina_cainta', 'Solo Self-Shoot Express', 'Self-Shoot', 399.00, 20, 'Unlimited shots for 15 minutes + 5 minutes photo selection. Includes 1 printed 4R photo.', '["Unlimited Raw Soft Copies", "1x 4R Printed Photo", "1 Custom Backdrop Color", "Full Remote Control"]', 1, 1),
('pkg_duo_portrait', 'std_lumina_cainta', 'Duo / Couple Special', 'Self-Shoot', 699.00, 30, 'Perfect for couples, besties, or siblings. 25 mins shoot time + 5 mins selection.', '["Unlimited Raw Soft Copies", "2x 4R Printed Photos", "1x Postcard Grid Print", "2 Backdrop Color Changes"]', 1, 1),
('pkg_grad_creative', 'std_lumina_cainta', 'Graduation & Creative Studio', 'Portrait', 1299.00, 45, 'Professional lighted studio session with creative backdrop options and high-res editing.', '["30 Mins Studio Session", "5 Edited High-Res Photos", "2x 5R Printed Photos", "Academic Gown Props Available"]', 1, 1);

INSERT INTO `payment_reminder_settings` (`id`, `studio_id`, `enable_auto_reminders`, `send_days_before`, `notify_via_sms`, `notify_via_email`, `custom_message`) VALUES
('prs_lumina', 'std_lumina_cainta', 1, 1, 0, 1, 'Friendly reminder from Lumina Studio: Your photoshoot downpayment or remaining balance is due soon. Please pay via GCash QR Ph to lock in your slot!');