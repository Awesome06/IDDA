IF OBJECT_ID('LoadDatabaseFromCSV', 'P') IS NOT NULL
    DROP PROCEDURE LoadDatabaseFromCSV;
GO

CREATE PROCEDURE LoadDatabaseFromCSV
AS
BEGIN
    SET NOCOUNT ON;

    PRINT '==================================================';
    PRINT ' PHASE 0: CLEARING EXISTING DATA';
    PRINT '==================================================';
    
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM stocks;
    DELETE FROM products;
    DELETE FROM staffs;
    DELETE FROM brands;
    DELETE FROM categories;
    DELETE FROM stores;
    DELETE FROM customers;

    PRINT 'Existing data cleared successfully.';
    PRINT '';
    PRINT '==================================================';
    PRINT ' PHASE 1: LOADING PARENT TABLES';
    PRINT '==================================================';
    
    PRINT 'Loading Brands...';
    BULK INSERT brands FROM 'C:\Projects\IDDA\datasets\brands.csv' WITH (FORMAT='CSV', FIRSTROW=2, FIELDQUOTE='"', FIELDTERMINATOR=',', ROWTERMINATOR='\n');

    PRINT 'Loading Categories...';
    BULK INSERT categories FROM 'C:\Projects\IDDA\datasets\categories.csv' WITH (FORMAT='CSV', FIRSTROW=2, FIELDQUOTE='"', FIELDTERMINATOR=',', ROWTERMINATOR='\n');

    PRINT 'Loading Stores...';
    BULK INSERT stores FROM 'C:\Projects\IDDA\datasets\stores.csv' WITH (FORMAT='CSV', FIRSTROW=2, FIELDQUOTE='"', FIELDTERMINATOR=',', ROWTERMINATOR='\n');

    PRINT 'Loading Customers (with NULL sanitation)...';
    CREATE TABLE #customers_stage (
        customer_id VARCHAR(50), first_name VARCHAR(100), last_name VARCHAR(100), phone VARCHAR(50), 
        email VARCHAR(255), street VARCHAR(255), city VARCHAR(100), state VARCHAR(50), zip_code VARCHAR(20)
    );
    BULK INSERT #customers_stage FROM 'C:\Projects\IDDA\datasets\customers.csv' WITH (FORMAT='CSV', FIRSTROW=2, FIELDQUOTE='"', FIELDTERMINATOR=',', ROWTERMINATOR='\n');
    
    INSERT INTO customers
    SELECT customer_id, first_name, last_name, NULLIF(phone, 'NULL'), email, street, city, state, zip_code 
    FROM #customers_stage;
    DROP TABLE #customers_stage;

    PRINT '';
    PRINT '==================================================';
    PRINT ' PHASE 2: LOADING LEVEL 1 CHILD TABLES';
    PRINT '==================================================';
    
    PRINT 'Loading Products...';
    BULK INSERT products FROM 'C:\Projects\IDDA\datasets\products.csv' WITH (FORMAT='CSV', FIRSTROW=2, FIELDQUOTE='"', FIELDTERMINATOR=',', ROWTERMINATOR='\n');

    PRINT 'Loading Staffs (with NULL sanitation)...';
    CREATE TABLE #staffs_stage (
        staff_id VARCHAR(50), first_name VARCHAR(100), last_name VARCHAR(100), email VARCHAR(255), 
        phone VARCHAR(50), active VARCHAR(10), store_id VARCHAR(50), manager_id VARCHAR(50)
    );
    BULK INSERT #staffs_stage FROM 'C:\Projects\IDDA\datasets\staffs.csv' WITH (FORMAT='CSV', FIRSTROW=2, FIELDQUOTE='"', FIELDTERMINATOR=',', ROWTERMINATOR='\n');
    
    INSERT INTO staffs
    SELECT staff_id, first_name, last_name, email, NULLIF(phone, 'NULL'), active, store_id, NULLIF(manager_id, 'NULL') 
    FROM #staffs_stage;
    DROP TABLE #staffs_stage;

    PRINT '';
    PRINT '==================================================';
    PRINT ' PHASE 3: LOADING LEVEL 2 CHILD TABLES';
    PRINT '==================================================';
    
    PRINT 'Loading Stocks...';
    BULK INSERT stocks FROM 'C:\Projects\IDDA\datasets\stocks.csv' WITH (FORMAT='CSV', FIRSTROW=2, FIELDQUOTE='"', FIELDTERMINATOR=',', ROWTERMINATOR='\n');

    PRINT 'Loading Orders (with NULL sanitation)...';
    CREATE TABLE #orders_stage (
        order_id VARCHAR(50), customer_id VARCHAR(50), order_status VARCHAR(50), order_date VARCHAR(50), 
        required_date VARCHAR(50), shipped_date VARCHAR(50), store_id VARCHAR(50), staff_id VARCHAR(50)
    );
    BULK INSERT #orders_stage FROM 'C:\Projects\IDDA\datasets\orders.csv' WITH (FORMAT='CSV', FIRSTROW=2, FIELDQUOTE='"', FIELDTERMINATOR=',', ROWTERMINATOR='\n');
    
    INSERT INTO orders
    SELECT order_id, customer_id, order_status, order_date, required_date, NULLIF(shipped_date, 'NULL'), store_id, staff_id 
    FROM #orders_stage;
    DROP TABLE #orders_stage;

    PRINT '';
    PRINT '==================================================';
    PRINT ' PHASE 4: LOADING LEVEL 3 CHILD TABLES';
    PRINT '==================================================';
    
    PRINT 'Loading Order Items...';
    BULK INSERT order_items FROM 'C:\Projects\IDDA\datasets\order_items.csv' WITH (FORMAT='CSV', FIRSTROW=2, FIELDQUOTE='"', FIELDTERMINATOR=',', ROWTERMINATOR='\n');

    PRINT '==================================================';
    PRINT ' SUCCESS! All data loaded and sanitized.';
    PRINT '==================================================';
END;
GO