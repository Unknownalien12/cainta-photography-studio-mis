-- ============================================================================
-- Cainta Photography Studio MIS - MySQL Database Schema
-- Complete table definitions matching the application data models
-- ============================================================================

CREATE DATABASE IF NOT EXISTS cainta_studio_mis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cainta_studio_mis;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('SUPER_ADMIN', 'STUDIO_ADMIN', 'STUDIO_STAFF', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER',
    studio_id VARCHAR(64) NULL,
    contact_number VARCHAR(50) NULL,
    address TEXT NULL,
    avatar TEXT NULL,
    status ENUM('active', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role),
    INDEX idx_user_studio (studio_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(50) NULL,
    address TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_customer_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Studios Table
CREATE TABLE IF NOT EXISTS studios (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id VARCHAR(64) NOT NULL,
    logo TEXT NULL,
    cover_image TEXT NULL,
    location VARCHAR(255) NOT NULL,
    rating DECIMAL(3,2) DEFAULT 5.00,
    review_count INT DEFAULT 0,
    starting_price DECIMAL(10,2) DEFAULT 0.00,
    categories JSON NULL,
    description TEXT NULL,
    address TEXT NULL,
    contact_info VARCHAR(255) NULL,
    email VARCHAR(255) NOT NULL,
    business_hours VARCHAR(255) NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'pending',
    printing_available BOOLEAN DEFAULT FALSE,
    latitude DECIMAL(10,8) NULL,
    longitude DECIMAL(11,8) NULL,
    business_permit TEXT NULL,
    valid_id TEXT NULL,
    other_docs JSON NULL,
    blocked_dates JSON NULL,
    gcash_name VARCHAR(255) NULL,
    gcash_number VARCHAR(50) NULL,
    gcash_qr_code TEXT NULL,
    portfolio_images JSON NULL,
    services_offered JSON NULL,
    website VARCHAR(255) NULL,
    facebook VARCHAR(255) NULL,
    instagram VARCHAR(255) NULL,
    tiktok VARCHAR(255) NULL,
    youtube VARCHAR(255) NULL,
    twitter VARCHAR(255) NULL,
    social_links JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_studio_status (status),
    INDEX idx_studio_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Services Table
CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(64) PRIMARY KEY,
    studio_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category VARCHAR(100) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    duration_minutes INT NOT NULL,
    image TEXT NULL,
    images JSON NULL,
    is_active BOOLEAN DEFAULT TRUE,
    available_days JSON NULL,
    available_slots JSON NULL,
    requirements TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_service_studio (studio_id),
    INDEX idx_service_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Packages Table
CREATE TABLE IF NOT EXISTS packages (
    id VARCHAR(64) PRIMARY KEY,
    studio_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration_minutes INT NOT NULL,
    edited_photos_count INT DEFAULT 0,
    included_prints TEXT NULL,
    photographer_count INT DEFAULT 1,
    included_services JSON NULL,
    terms_and_conditions TEXT NULL,
    image TEXT NULL,
    images JSON NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_package_studio (studio_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Addons Table
CREATE TABLE IF NOT EXISTS addons (
    id VARCHAR(64) PRIMARY KEY,
    studio_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT NULL,
    image TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_addon_studio (studio_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(64) PRIMARY KEY,
    studio_id VARCHAR(64) NOT NULL,
    customer_id VARCHAR(64) NOT NULL,
    service_id VARCHAR(64) NULL,
    package_id VARCHAR(64) NULL,
    booking_date DATE NOT NULL,
    time_slot VARCHAR(10) NOT NULL,
    addons JSON NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_notes TEXT NULL,
    requirements_doc TEXT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    total_amount DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    down_payment_amount DECIMAL(10,2) DEFAULT 0.00,
    remaining_balance DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    final_payment_status VARCHAR(50) DEFAULT 'unpaid',
    payment_option VARCHAR(20) DEFAULT 'downpayment',
    payment_due_at DATETIME NULL,
    payment_reference VARCHAR(100) NULL,
    proof_of_payment TEXT NULL,
    cancellation_reason TEXT NULL,
    cancelled_by VARCHAR(100) NULL,
    cancelled_at DATETIME NULL,
    assigned_staff_id VARCHAR(64) NULL,
    checklist JSON NULL,
    last_reminder_sent_at DATETIME NULL,
    reminder_count INT DEFAULT 0,
    archived_by_customer BOOLEAN DEFAULT FALSE,
    archived_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_booking_studio (studio_id),
    INDEX idx_booking_customer (customer_id),
    INDEX idx_booking_date (booking_date),
    INDEX idx_booking_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(64) PRIMARY KEY,
    gcash_session_id VARCHAR(64) NULL,
    booking_id VARCHAR(64) NULL,
    print_order_id VARCHAR(64) NULL,
    studio_id VARCHAR(64) NOT NULL,
    customer_id VARCHAR(64) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_type VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending_verification',
    proof_of_payment TEXT NULL,
    reference_number VARCHAR(100) NULL,
    gateway_transaction_id VARCHAR(100) NULL,
    fraud_score DECIMAL(5,2) NULL,
    payment_channel VARCHAR(50) NULL,
    payment_date DATETIME NOT NULL,
    reviewed_by VARCHAR(255) NULL,
    reviewed_at DATETIME NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_payment_studio (studio_id),
    INDEX idx_payment_customer (customer_id),
    INDEX idx_payment_booking (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. GCash Sessions Table
CREATE TABLE IF NOT EXISTS gcash_sessions (
    id VARCHAR(64) PRIMARY KEY,
    payment_id VARCHAR(64) NULL,
    booking_id VARCHAR(64) NULL,
    print_order_id VARCHAR(64) NULL,
    studio_id VARCHAR(64) NOT NULL,
    studio_name VARCHAR(255) NULL,
    studio_gcash_name VARCHAR(255) NULL,
    studio_gcash_number VARCHAR(50) NULL,
    customer_id VARCHAR(64) NOT NULL,
    gateway VARCHAR(50) DEFAULT 'paymongo',
    gateway_payment_intent_id VARCHAR(100) NOT NULL,
    qr_code_data LONGTEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    full_amount DECIMAL(10,2) NULL,
    down_payment_amount DECIMAL(10,2) NULL,
    payment_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    expires_at DATETIME NOT NULL,
    paid_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_gcash_studio (studio_id),
    INDEX idx_gcash_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Print Products Table
CREATE TABLE IF NOT EXISTS print_products (
    id VARCHAR(64) PRIMARY KEY,
    studio_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    size VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image TEXT NULL,
    in_stock BOOLEAN DEFAULT TRUE,
    estimated_hours INT DEFAULT 24,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_print_prod_studio (studio_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Print Orders Table
CREATE TABLE IF NOT EXISTS print_orders (
    id VARCHAR(64) PRIMARY KEY,
    studio_id VARCHAR(64) NOT NULL,
    customer_id VARCHAR(64) NOT NULL,
    product_id VARCHAR(64) NOT NULL,
    quantity INT DEFAULT 1,
    uploaded_photo TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    proof_of_payment TEXT NULL,
    reference_number VARCHAR(100) NULL,
    shipping_address TEXT NULL,
    tracking_number VARCHAR(100) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_print_order_studio (studio_id),
    INDEX idx_print_order_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(64) PRIMARY KEY,
    studio_id VARCHAR(64) NOT NULL,
    customer_id VARCHAR(64) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    booking_id VARCHAR(64) NULL,
    rating INT NOT NULL,
    comment TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    is_visible BOOLEAN DEFAULT TRUE,
    reply TEXT NULL,
    reply_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_review_studio (studio_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Photo Proofings Table
CREATE TABLE IF NOT EXISTS photo_proofings (
    id VARCHAR(64) PRIMARY KEY,
    booking_id VARCHAR(64) NOT NULL,
    studio_id VARCHAR(64) NOT NULL,
    customer_id VARCHAR(64) NOT NULL,
    photos JSON NOT NULL,
    watermark_text VARCHAR(255) NOT NULL,
    watermark_position VARCHAR(50) DEFAULT 'repeat_diagonal',
    watermark_opacity DECIMAL(3,2) DEFAULT 0.35,
    final_drive_link TEXT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_proofing_booking (booking_id),
    INDEX idx_proofing_studio (studio_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. FAQs Table
CREATE TABLE IF NOT EXISTS faqs (
    id VARCHAR(64) PRIMARY KEY,
    studio_id VARCHAR(64) NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    frequency INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_faq_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Promotions Table
CREATE TABLE IF NOT EXISTS promotions (
    id VARCHAR(64) PRIMARY KEY,
    studio_id VARCHAR(64) NULL,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255) NULL,
    discount VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    location VARCHAR(255) NULL,
    valid_until VARCHAR(100) NULL,
    description TEXT NULL,
    image TEXT NULL,
    badge VARCHAR(100) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_promo_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    studio_id VARCHAR(64) NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    type VARCHAR(50) DEFAULT 'info',
    link TEXT NULL,
    channel VARCHAR(50) DEFAULT 'in_app',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notif_user (user_id),
    INDEX idx_notif_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    timestamp DATETIME NOT NULL,
    ip_address VARCHAR(50) NULL,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
    id VARCHAR(64) PRIMARY KEY,
    customer_id VARCHAR(64) NOT NULL,
    studio_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_customer_studio (customer_id, studio_id),
    INDEX idx_fav_customer (customer_id),
    INDEX idx_fav_studio (studio_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Studio Availability Table
CREATE TABLE IF NOT EXISTS studio_availability (
    id VARCHAR(64) PRIMARY KEY,
    studio_id VARCHAR(64) NOT NULL,
    day_of_week INT NOT NULL, -- 0=Sun, 1=Mon, ..., 6=Sat
    opening_time VARCHAR(10) NOT NULL,
    closing_time VARCHAR(10) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    slot_duration_minutes INT DEFAULT 60,
    INDEX idx_avail_studio (studio_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Availability Blackouts Table
CREATE TABLE IF NOT EXISTS availability_blackouts (
    id VARCHAR(64) PRIMARY KEY,
    studio_id VARCHAR(64) NOT NULL,
    blackout_date DATE NOT NULL,
    start_time VARCHAR(10) NULL,
    end_time VARCHAR(10) NULL,
    reason VARCHAR(255) NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    INDEX idx_blackout_studio (studio_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. Custom Pages Table
CREATE TABLE IF NOT EXISTS custom_pages (
    id VARCHAR(64) PRIMARY KEY,
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    blocks JSON NULL,
    content LONGTEXT NULL,
    is_published BOOLEAN DEFAULT TRUE,
    show_in_navbar BOOLEAN DEFAULT TRUE,
    show_in_footer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_page_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id VARCHAR(64) PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value LONGTEXT NULL,
    description TEXT NULL,
    category VARCHAR(100) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24. Studio Inventory Table
CREATE TABLE IF NOT EXISTS studio_inventory (
    id VARCHAR(64) PRIMARY KEY,
    studio_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- camera, lens, lighting, audio, accessory
    serial_number VARCHAR(100) NULL,
    status VARCHAR(50) DEFAULT 'available',
    location_rack VARCHAR(100) NULL,
    assigned_to VARCHAR(255) NULL,
    last_maintenance DATE NULL,
    notes TEXT NULL,
    purchase_date DATE NULL,
    gear_condition VARCHAR(50) DEFAULT 'mint',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_inventory_studio (studio_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 25. Studio Client Notes Table
CREATE TABLE IF NOT EXISTS studio_client_notes (
    id VARCHAR(64) PRIMARY KEY,
    studio_id VARCHAR(64) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    note TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    author_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_client_notes_studio (studio_id),
    INDEX idx_client_notes_email (client_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 26. Automated Reminder Logs Table
CREATE TABLE IF NOT EXISTS automated_reminder_logs (
    id VARCHAR(64) PRIMARY KEY,
    studio_id VARCHAR(64) NOT NULL,
    booking_id VARCHAR(64) NOT NULL,
    customer_id VARCHAR(64) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    reminder_type VARCHAR(50) NOT NULL,
    amount_due DECIMAL(10,2) NOT NULL,
    booking_date DATE NOT NULL,
    time_slot VARCHAR(10) NOT NULL,
    service_title VARCHAR(255) NOT NULL,
    channels JSON NULL,
    status VARCHAR(50) DEFAULT 'sent',
    message TEXT NOT NULL,
    sent_at DATETIME NOT NULL,
    triggered_by VARCHAR(50) DEFAULT 'background_service',
    INDEX idx_reminder_studio (studio_id),
    INDEX idx_reminder_booking (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 27. Studio Reminder Settings Table
CREATE TABLE IF NOT EXISTS studio_reminder_settings (
    studio_id VARCHAR(64) PRIMARY KEY,
    auto_reminders_enabled BOOLEAN DEFAULT TRUE,
    check_interval_seconds INT DEFAULT 60,
    remind_downpayment_hours_before INT DEFAULT 48,
    remind_balance_days_before INT DEFAULT 3,
    min_hours_between_reminders INT DEFAULT 12,
    notify_via_in_app BOOLEAN DEFAULT TRUE,
    notify_via_email BOOLEAN DEFAULT TRUE,
    notify_via_sms BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- End of Schema Script
-- ============================================================================
