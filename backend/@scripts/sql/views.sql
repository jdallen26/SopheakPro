USE [MBMMaster]
GO

/****** Object:  View [dbo].[vw_Payroll_Tasks]    Script Date: 12/9/2025 3:46:44 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE VIEW [dbo].[vw_Payroll_Sites] as
SELECT DISTINCT mi.CustID,
                s.Company,
                s.cod AS COD,
                s.Mailto,
                s.Taxable,
                s.Voucher,
                s.OtherBill,
                s.AdvBill,
                1     AS [InMonthly]
FROM MonthlyInvoice AS mi
         LEFT JOIN Site AS s on mi.CustID = s.CustID
UNION
SELECT DISTINCT s.CustID,
       s.Company,
       s.cod AS COD,
       s.Mailto,
       s.Taxable,
       s.Voucher,
       s.OtherBill,
       s.AdvBill,
       0     AS [InMonthly]
FROM [Site] AS s
WHERE s.Active = 1
  AND s.CustID NOT IN (SELECT [CustID] FROM MonthlyInvoice)
WHERE mi.CustID IS NOT NULL
GO

CREATE view [dbo].[vw_Payroll_Comments] as
SELECT DISTINCT [comment]
FROM (SELECT mi.[comment]
      FROM MonthlyInvoice AS mi
      WHERE NOT mi.comment IS NULL
      UNION
      SELECT hi.[comment]
      FROM HistofInvc_current AS hi
      GROUP BY hi.[comment]
      HAVING count(hi.[comment]) >= 100) t
GO

CREATE VIEW [dbo].[vw_Payroll_Sites] as
SELECT DISTINCT mi.CustID,
                s.Company,
                mi.Weekof,
                s.cod AS COD,
                s.Mailto,
                s.Taxable,
                s.Voucher,
                s.OtherBill,
                s.AdvBill,
                1     AS [InMonthly]
FROM MonthlyInvoice AS mi
         LEFT JOIN Site AS s on mi.CustID = s.CustID
UNION
SELECT s.CustID,
       s.Company,
       null AS weekof,
       s.cod AS COD,
       s.Mailto,
       s.Taxable,
       s.Voucher,
       s.OtherBill,
       s.AdvBill,
       0     AS [InMonthly]
FROM [Site] AS s
WHERE s.Active = 1
  AND s.CustID NOT IN (SELECT [CustID] FROM MonthlyInvoice)
GO
