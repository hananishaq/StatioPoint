EXEC xp_instance_regwrite N'HKEY_LOCAL_MACHINE', N'Software\Microsoft\MSSQLServer\MSSQLServer', N'LoginMode', REG_DWORD, 2;
GO
ALTER LOGIN sa WITH PASSWORD = '123456';
GO
ALTER LOGIN sa ENABLE;
GO
