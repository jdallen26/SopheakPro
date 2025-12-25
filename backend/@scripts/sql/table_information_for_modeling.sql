USE MBMMaster
GO

DECLARE
	@TableName VARCHAR(255),
	@withTableDisplay BIT

SET @TableName = 'tasks'
SET @withTableDisplay = 0

SELECT ci.table_schema AS [Schema], ci.column_name [Column], ci.data_type AS [Type], ci.character_maximum_length AS [Max], ci.is_nullable AS [Nullable], ci.column_default AS [Default], ci.is_primary_key AS [IsPK]
FROM mbm_admin.vw_columns_info ci
WHERE ci.table_name = @TableName
ORDER BY ci.ordinal_position


IF @withTableDisplay = 1
BEGIN
    DECLARE @sql nvarchar(max) = N'SELECT * FROM ' + @TableName
        + N' WHERE AdvDate IS NOT NULL ORDER BY ID DESC;';
    PRINT @sql;
    EXEC sp_executesql @sql;
END
