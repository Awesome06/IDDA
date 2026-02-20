/*
=============================================================
Create Database and Schemas
=============================================================
Script Purpose:
    This script creates a new database named 'BikeStore' after checking if it already exists. 
    If the database exists, it is dropped and recreated.
	
WARNING:
    Running this script will drop the entire 'BikeStore' database if it exists. 
    All data in the database will be permanently deleted. Proceed with caution 
    and ensure you have proper backups before running this script.
*/

USE master;
GO

-- Drop and recreate the 'BikeStore' database
IF EXISTS (SELECT 1 FROM sys.databases WHERE name = 'BikeStore')
BEGIN
    ALTER DATABASE BikeStore SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE BikeStore;
END;
GO

-- Create the 'BikeStore' database
CREATE DATABASE BikeStore;
GO

USE BikeStore;
GO