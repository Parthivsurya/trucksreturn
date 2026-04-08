-- Smart Return Load Platform — Seed Data
-- Demo data across major Indian freight corridors

-- Passwords are all 'demo1234' hashed with bcryptjs
-- $2a$10$k1M53UxAPKgxFB9nOaBdTO/A8Uuxw7TdCjSaK4uHZJPytDETMU56G

-- Admin user (password: admin123)
INSERT OR IGNORE INTO users (name, email, phone, password_hash, role) VALUES
('Platform Admin', 'admin@returnload.com', '9000000000', '$2a$10$KkOZulKUiy7whxRQsoYLV.xhIR5g.UaefWnJ4YV6etaLhiqnyQixm', 'admin');

-- Drivers
INSERT OR IGNORE INTO users (id, name, email, phone, password_hash, role, avg_rating, total_ratings) VALUES
(1, 'Rajesh Kumar', 'rajesh@demo.com', '9876543210', '$2a$10$k1M53UxAPKgxFB9nOaBdTO/A8Uuxw7TdCjSaK4uHZJPytDETMU56G', 'driver', 4.5, 28),
(2, 'Suresh Yadav', 'suresh@demo.com', '9876543211', '$2a$10$k1M53UxAPKgxFB9nOaBdTO/A8Uuxw7TdCjSaK4uHZJPytDETMU56G', 'driver', 4.2, 15),
(3, 'Mohammed Irfan', 'irfan@demo.com', '9876543212', '$2a$10$k1M53UxAPKgxFB9nOaBdTO/A8Uuxw7TdCjSaK4uHZJPytDETMU56G', 'driver', 4.8, 42),
(4, 'Prakash Reddy', 'prakash@demo.com', '9876543213', '$2a$10$k1M53UxAPKgxFB9nOaBdTO/A8Uuxw7TdCjSaK4uHZJPytDETMU56G', 'driver', 3.9, 10),
(5, 'Gurmeet Singh', 'gurmeet@demo.com', '9876543214', '$2a$10$k1M53UxAPKgxFB9nOaBdTO/A8Uuxw7TdCjSaK4uHZJPytDETMU56G', 'driver', 4.6, 35);

-- Shippers
INSERT OR IGNORE INTO users (id, name, email, phone, password_hash, role, avg_rating, total_ratings) VALUES
(6, 'Textile Traders Co.', 'textiles@demo.com', '9123456780', '$2a$10$k1M53UxAPKgxFB9nOaBdTO/A8Uuxw7TdCjSaK4uHZJPytDETMU56G', 'shipper', 4.7, 55),
(7, 'FreshFarm Exports', 'freshfarm@demo.com', '9123456781', '$2a$10$k1M53UxAPKgxFB9nOaBdTO/A8Uuxw7TdCjSaK4uHZJPytDETMU56G', 'shipper', 4.3, 22),
(8, 'Steel India Pvt Ltd', 'steel@demo.com', '9123456782', '$2a$10$k1M53UxAPKgxFB9nOaBdTO/A8Uuxw7TdCjSaK4uHZJPytDETMU56G', 'shipper', 4.1, 18),
(9, 'AutoParts Hub', 'autoparts@demo.com', '9123456783', '$2a$10$k1M53UxAPKgxFB9nOaBdTO/A8Uuxw7TdCjSaK4uHZJPytDETMU56G', 'shipper', 4.5, 30),
(10, 'Kerala Spice Trading', 'spice@demo.com', '9123456784', '$2a$10$k1M53UxAPKgxFB9nOaBdTO/A8Uuxw7TdCjSaK4uHZJPytDETMU56G', 'shipper', 4.4, 25);

-- Trucks
INSERT OR IGNORE INTO trucks (id, user_id, truck_type, capacity_tons, permit_number, home_state, registration_number) VALUES
(1, 1, 'Tata Prima', 16, 'NP-MH-2024-001', 'Maharashtra', 'MH04-BJ-1234'),
(2, 2, 'Ashok Leyland', 12, 'NP-UP-2024-002', 'Uttar Pradesh', 'UP32-FT-5678'),
(3, 3, 'BharatBenz', 20, 'NP-KA-2024-003', 'Karnataka', 'KA01-MX-9012'),
(4, 4, 'Eicher Pro', 10, 'NP-TN-2024-004', 'Tamil Nadu', 'TN09-AK-3456'),
(5, 5, 'Tata Signa', 25, 'NP-PB-2024-005', 'Punjab', 'PB02-DR-7890');

-- Driver Availability (active broadcasts)
INSERT OR IGNORE INTO driver_availability (id, user_id, current_lat, current_lng, dest_lat, dest_lng, current_city, destination_city, status) VALUES
(1, 1, 28.6139, 77.2090, 19.0760, 72.8777, 'Delhi', 'Mumbai', 'active'),
(2, 2, 12.9716, 77.5946, 17.3850, 78.4867, 'Bangalore', 'Hyderabad', 'active'),
(3, 3, 13.0827, 80.2707, 9.9312, 76.2673, 'Chennai', 'Kochi', 'active'),
(4, 5, 28.6139, 77.2090, 26.9124, 75.7873, 'Delhi', 'Jaipur', 'active');

-- Open Loads
INSERT OR IGNORE INTO loads (id, user_id, pickup_lat, pickup_lng, delivery_lat, delivery_lng, pickup_city, delivery_city, cargo_type, weight_tons, description, offered_price, timeline, status) VALUES
(1, 6, 28.4595, 77.0266, 19.0760, 72.8777, 'Gurugram', 'Mumbai', 'Textiles', 8, 'Cotton fabric rolls, 200 bundles, weather-protected packaging required', 45000, '2-3 days', 'open'),
(2, 7, 28.6139, 77.2090, 25.3176, 82.9739, 'Delhi', 'Varanasi', 'Agricultural Produce', 5, 'Fresh vegetables in refrigerated packaging, time-sensitive delivery', 22000, '24 hours', 'open'),
(3, 8, 12.9716, 77.5946, 17.3850, 78.4867, 'Bangalore', 'Hyderabad', 'Steel', 15, 'TMT bars and steel rods, heavy load, crane required for unloading', 35000, '2 days', 'open'),
(4, 9, 13.0827, 80.2707, 11.0168, 76.9558, 'Chennai', 'Coimbatore', 'Auto Parts', 6, 'Engine components and spare parts in crated packaging', 15000, '1 day', 'open'),
(5, 10, 9.9312, 76.2673, 13.0827, 80.2707, 'Kochi', 'Chennai', 'Spices', 4, 'Cardamom and pepper, sealed moisture-proof bags', 18000, '2 days', 'open'),
(6, 6, 27.1767, 78.0081, 26.9124, 75.7873, 'Agra', 'Jaipur', 'Textiles', 3, 'Silk sarees in protective cartons, handle with care', 12000, '1 day', 'open'),
(7, 8, 19.0760, 72.8777, 18.5204, 73.8567, 'Mumbai', 'Pune', 'Steel', 18, 'Steel plates and angle bars for construction', 8000, '6 hours', 'open'),
(8, 7, 26.8467, 80.9462, 28.6139, 77.2090, 'Lucknow', 'Delhi', 'Agricultural Produce', 7, 'Mangoes in cushioned crates, priority delivery', 16000, '1 day', 'open'),
(9, 9, 23.0225, 72.5714, 19.0760, 72.8777, 'Ahmedabad', 'Mumbai', 'Auto Parts', 9, 'Transmission assemblies, fragile, anti-vibration packaging', 20000, '2 days', 'open'),
(10, 10, 8.5241, 76.9366, 10.8505, 76.2711, 'Trivandrum', 'Palakkad', 'Spices', 3, 'Black pepper and turmeric, export quality, sealed containers', 8000, '1 day', 'open');

-- Some completed bookings for history
INSERT OR IGNORE INTO bookings (id, load_id, driver_id, shipper_id, agreed_price, status, booked_at, delivered_at) VALUES
(1, 1, 1, 6, 43000, 'delivered', '2026-03-10 10:00:00', '2026-03-12 18:00:00'),
(2, 3, 3, 8, 34000, 'delivered', '2026-03-11 08:00:00', '2026-03-12 14:00:00');

-- Ratings for completed bookings
INSERT OR IGNORE INTO ratings (id, booking_id, from_user_id, to_user_id, score, comment) VALUES
(1, 1, 6, 1, 5, 'Excellent delivery, on time and cargo in perfect condition'),
(2, 1, 1, 6, 4, 'Good shipper, accurate load description'),
(3, 2, 8, 3, 5, 'Very professional driver, handled heavy steel carefully'),
(4, 2, 3, 8, 5, 'Reliable shipper, quick payment');
