-- Project Desk Database Schema for PostgreSQL
-- Run this script to create the initial database structure

-- Create database (run separately if needed)
-- CREATE DATABASE project_desk_db;

-- Connect to the database
-- \c project_desk_db

-- Users table (handled by Django migrations, but here for reference)
-- This table is created by Django's migration system

-- Initial admin user (password: admin123)
-- Insert after running Django migrations
-- INSERT INTO users (full_name, username, email, password, role, is_active, is_staff, is_superuser, created_at)
-- VALUES ('Admin User', 'admin', 'admin@projectdesk.com', 
--         'pbkdf2_sha256$720000$...', 'admin', true, true, true, NOW());

-- Notes:
-- 1. Run Django migrations first: python manage.py migrate
-- 2. Create superuser: python manage.py createsuperuser
-- 3. This file is for reference - Django handles the schema
