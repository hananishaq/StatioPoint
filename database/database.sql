-- ═══════════════════════════════════════════════════
--  StatioPoint Database — Run in SSMS
--  Uses Windows Authentication
-- ═══════════════════════════════════════════════════

USE master;
GO

ALTER DATABASE StatioPoint
SET SINGLE_USER
WITH ROLLBACK IMMEDIATE;
GO

DROP DATABASE StatioPoint;
GO

CREATE DATABASE StatioPoint;
GO
USE StatioPoint;
GO

-- USERS TABLE
CREATE TABLE Users (
  id        INT IDENTITY(1,1) PRIMARY KEY,
  fullName  NVARCHAR(100) NOT NULL,
  username  NVARCHAR(50)  NOT NULL UNIQUE,
  email     NVARCHAR(100) NOT NULL UNIQUE,
  phone     NVARCHAR(20),
  password  NVARCHAR(255) NOT NULL,
  role      NVARCHAR(20)  NOT NULL DEFAULT 'cashier', -- admin / cashier
  branch    NVARCHAR(100) DEFAULT 'Main Branch',
  isActive  BIT           DEFAULT 1,
  createdAt DATETIME      DEFAULT GETDATE()
);
GO

-- PRODUCTS TABLE
CREATE TABLE Products (
  id        INT IDENTITY(1,1) PRIMARY KEY,
  name      NVARCHAR(150) NOT NULL,
  sku       NVARCHAR(50)  UNIQUE,
  category  NVARCHAR(50)  NOT NULL,
  price     DECIMAL(10,2) NOT NULL,
  stock     INT           DEFAULT 0,
  minStock  INT           DEFAULT 5,
  createdAt DATETIME      DEFAULT GETDATE()
);
GO

-- SALES TABLE
CREATE TABLE Sales (
  id          INT IDENTITY(1,1) PRIMARY KEY,
  userId      INT           NOT NULL REFERENCES Users(id),
  totalAmount DECIMAL(10,2) NOT NULL,
  paymentType NVARCHAR(20)  DEFAULT 'cash',
  status      NVARCHAR(20)  DEFAULT 'paid',
  saleDate    DATETIME      DEFAULT GETDATE()
);
GO

-- SALE ITEMS TABLE
CREATE TABLE SaleItems (
  id        INT IDENTITY(1,1) PRIMARY KEY,
  saleId    INT           NOT NULL REFERENCES Sales(id),
  productId INT           NOT NULL REFERENCES Products(id),
  quantity  INT           NOT NULL,
  unitPrice DECIMAL(10,2) NOT NULL,
  subtotal  DECIMAL(10,2) NOT NULL
);
GO

-- ── SAMPLE DATA ──────────────────────────────────

-- Admin user  (password: admin123)
INSERT INTO Users (fullName,username,email,phone,password,role,branch) VALUES
('Ahmed Khan','ahmed.khan','ahmed@statiopoint.pk','+92 300 1234567',
'$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHi2','admin','Main Branch — Lahore');

-- Cashier user  (password: cashier123)
INSERT INTO Users (fullName,username,email,phone,password,role,branch) VALUES
('Sara Ahmed','sara.ahmed','sara@statiopoint.pk','+92 301 9876543',
'$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ucrRHaHNO.','cashier','Main Branch — Lahore');

-- Products
INSERT INTO Products (name,sku,category,price,stock,minStock) VALUES
('Camlin Ball Pen Blue',      'PEN-001','Pens',          30.00, 248, 20),
('Camlin Ball Pen Red',       'PEN-002','Pens',          30.00, 180, 20),
('A4 Ruled Notebook 200pg',   'NB-042', 'Notebooks',    150.00,  85, 10),
('Faber Highlighter Set 5pc', 'MRK-017','Markers',      450.00,   4,  5),
('Stapler Heavy Duty 24/6',   'OFF-088','Office',       550.00,  32,  5),
('A4 White Paper Ream 500s',  'PPR-003','Paper',        900.00,   0, 10),
('Scissors Student 7inch',    'CUT-011','Cutting Tools',120.00,  67, 10),
('Watercolor Set 24 Colors',  'ART-055','Art Supplies',1200.00,   2,  5),
('Sticky Notes Yellow 3x3',   'PPR-010','Paper',         80.00, 160, 15),
('Geometry Box Student',      'OFF-022','Office',       250.00,   3,  5);
GO

-- Sales
INSERT INTO Sales (userId,totalAmount,paymentType,status,saleDate) VALUES
(2, 360.00,  'cash','paid',   DATEADD(hour,-2,GETDATE())),
(2, 750.00,  'cash','paid',   DATEADD(hour,-3,GETDATE())),
(2,1100.00,  'card','paid',   DATEADD(hour,-4,GETDATE())),
(2, 450.00,  'cash','paid',   DATEADD(hour,-5,GETDATE())),
(2, 320.00,  'cash','pending',DATEADD(hour,-6,GETDATE()));
GO

INSERT INTO SaleItems (saleId,productId,quantity,unitPrice,subtotal) VALUES
(1,1,12, 30.00, 360.00),(2,3, 5,150.00, 750.00),
(3,5, 2,550.00,1100.00),(4,4, 1,450.00, 450.00),
(5,9, 4, 80.00, 320.00);
GO

PRINT '✅ StatioPoint DB ready!';
PRINT 'Admin login   → username: ahmed.khan  password: admin123';
PRINT 'Cashier login → username: sara.ahmed  password: cashier123';
