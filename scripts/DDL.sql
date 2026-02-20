/*
===============================================================================
DDL Script: Create Tables and Relationships
===============================================================================
Script Purpose:
    This script creates tables and relationships, dropping existing tables 
    if they already exist in the correct dependency order.
    Run this script to re-define the DDL structure of the database.
===============================================================================
*/

-- ============================================================================
-- 1. DROP TABLES (Child tables first, then Parent tables)
-- ============================================================================

IF OBJECT_ID('order_items', 'U') IS NOT NULL DROP TABLE order_items;
IF OBJECT_ID('orders', 'U') IS NOT NULL DROP TABLE orders;
IF OBJECT_ID('stocks', 'U') IS NOT NULL DROP TABLE stocks;
IF OBJECT_ID('products', 'U') IS NOT NULL DROP TABLE products;
IF OBJECT_ID('categories', 'U') IS NOT NULL DROP TABLE categories;
IF OBJECT_ID('brands', 'U') IS NOT NULL DROP TABLE brands;
IF OBJECT_ID('staffs', 'U') IS NOT NULL DROP TABLE staffs;
IF OBJECT_ID('stores', 'U') IS NOT NULL DROP TABLE stores;
IF OBJECT_ID('customers', 'U') IS NOT NULL DROP TABLE customers;
GO

-- ============================================================================
-- 2. CREATE TABLES (Parent tables first, then Child tables)
-- ============================================================================

CREATE TABLE brands (
    brand_id INT PRIMARY KEY,
    brand_name VARCHAR(255)
);
GO

CREATE TABLE categories (
    category_id INT PRIMARY KEY,
    category_name VARCHAR(255)
);
GO

CREATE TABLE customers (
    customer_id INT PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(255),
    street VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20)
);
GO

CREATE TABLE stores (
    store_id INT PRIMARY KEY,
    store_name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    street VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20)
);
GO

CREATE TABLE staffs (
    staff_id INT PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(20),
    active BIT,
    store_id INT,
    manager_id INT
);
GO

CREATE TABLE products (
    product_id INT PRIMARY KEY,
    product_name VARCHAR(255),
    brand_id INT,
    category_id INT,
    model_year SMALLINT,
    list_price DECIMAL(10, 2)
);
GO

CREATE TABLE stocks (
    store_id INT,
    product_id INT,
    quantity INT,
    PRIMARY KEY (store_id, product_id)
);
GO

CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    customer_id INT,
    order_status TINYINT,
    order_date DATE,
    required_date DATE,
    shipped_date DATE,
    store_id INT,
    staff_id INT
);
GO

CREATE TABLE order_items (
    order_id INT,
    item_id INT,
    product_id INT,
    quantity INT,
    list_price DECIMAL(10, 2),
    discount DECIMAL(4, 2),
    PRIMARY KEY (order_id, item_id)
);
GO

-- ============================================================================
-- 3. ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Products Relationships
ALTER TABLE products ADD CONSTRAINT FK_products_brands FOREIGN KEY (brand_id) REFERENCES brands(brand_id);
ALTER TABLE products ADD CONSTRAINT FK_products_categories FOREIGN KEY (category_id) REFERENCES categories(category_id);

-- Stocks Relationships
ALTER TABLE stocks ADD CONSTRAINT FK_stocks_stores FOREIGN KEY (store_id) REFERENCES stores(store_id);
ALTER TABLE stocks ADD CONSTRAINT FK_stocks_products FOREIGN KEY (product_id) REFERENCES products(product_id);

-- Staffs Relationships
ALTER TABLE staffs ADD CONSTRAINT FK_staffs_stores FOREIGN KEY (store_id) REFERENCES stores(store_id);
ALTER TABLE staffs ADD CONSTRAINT FK_staffs_manager FOREIGN KEY (manager_id) REFERENCES staffs(staff_id);

-- Orders Relationships
ALTER TABLE orders ADD CONSTRAINT FK_orders_customers FOREIGN KEY (customer_id) REFERENCES customers(customer_id);
ALTER TABLE orders ADD CONSTRAINT FK_orders_stores FOREIGN KEY (store_id) REFERENCES stores(store_id);
ALTER TABLE orders ADD CONSTRAINT FK_orders_staffs FOREIGN KEY (staff_id) REFERENCES staffs(staff_id);

-- Order Items Relationships
ALTER TABLE order_items ADD CONSTRAINT FK_order_items_orders FOREIGN KEY (order_id) REFERENCES orders(order_id);
ALTER TABLE order_items ADD CONSTRAINT FK_order_items_products FOREIGN KEY (product_id) REFERENCES products(product_id);
GO