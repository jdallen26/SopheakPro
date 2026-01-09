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
  AND s.CustID NOT IN ('', NULL)
  And s.Company NOT IN ('', NULL)
GO

CREATE view [dbo].[vw_Payroll_Comments] as
SELECT ROW_NUMBER() OVER (ORDER BY t.comment) AS [id],
       comment,
       [count]
FROM (SELECT t.comment,
             SUM(t.count) AS [count]
      FROM (SELECT mi.[comment], COUNT(mi.[comment]) AS [count]
            FROM MonthlyInvoice AS mi
            WHERE mi.comment IS NOT NULL
            GROUP BY mi.comment

            UNION ALL

            SELECT hi.[comment], COUNT(hi.[comment]) AS [count]
            FROM HistofInvc_current AS hi
            WHERE hi.comment IS NOT NULL
            GROUP BY hi.comment) AS t
      GROUP BY t.comment) AS t
GO

CREATE VIEW [dbo].[vw_Payroll_Payroll_Weeks]
AS
SELECT ROW_NUMBER() OVER (ORDER BY Weekdone) AS row_id, Weekdone as payroll_week, COUNT([weekDone]) AS task_count
FROM MonthlyInvoice
WHERE Weekdone >= DATEADD(DAY, -365, GETDATE())
GROUP BY Weekdone
GO

CREATE VIEW [Accounting].[vw_Payroll_Aggregate]
AS
SELECT m.WeekOf,
       [route],
       COUNT(*)                                                        AS [Task_Count],
       COUNT(CASE WHEN DoneBy IS NOT NULL AND DoneBy <> '' THEN 1 END) AS [Completed_Count],
       -- Percent Complete Calculation
       CAST(COUNT(CASE WHEN DoneBy IS NOT NULL AND DoneBy <> '' THEN 1 END) * 100.0
           / NULLIF(COUNT(*), 0) AS DECIMAL(10, 2))                    AS [Percent_Complete]
FROM MonthlyInvoice AS m
GROUP BY WeekOf, Route

GO
CREATE VIEW [Accounting].[vw_Payroll_Aggregate]
AS
SELECT ROW_NUMBER() OVER (ORDER BY m.WeekOf, [route])                  AS [ID],
       m.WeekOf,
       [route],
       COUNT(*)                                                        AS [Task_Count],
       COUNT(CASE WHEN DoneBy IS NOT NULL AND DoneBy <> '' THEN 1 END) AS [Completed_Count],
       -- Percent Complete Calculation
       CAST(COUNT(CASE WHEN DoneBy IS NOT NULL AND DoneBy <> '' THEN 1 END) * 100.0
           / NULLIF(COUNT(*), 0) AS DECIMAL(10, 2))                    AS [Percent_Complete]
FROM MonthlyInvoice AS m
GROUP BY WeekOf, Route

GO