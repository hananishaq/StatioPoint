
CREATE DATABASE PakLegionWebToonDB;
GO
USE PakLegionWebToonDB;
GO

-- Create the PakLegionWebToonDB database
CREATE DATABASE PakLegionWebToonDB;
GO

-- Switch to the newly created database
USE PakLegionWebToonDB;
GO

-- Create the Regions table
CREATE TABLE Regions (
    RegionID INT PRIMARY KEY IDENTITY(1,1),
    RegionName NVARCHAR(100) NOT NULL,
    CulturalSignificance NVARCHAR(MAX)
);
GO

-- Create the Characters table
CREATE TABLE Characters (
    CharacterID INT PRIMARY KEY IDENTITY(1,1),
    CharacterName NVARCHAR(100) NOT NULL,
    Alias NVARCHAR(100),
    Age INT,
    BackgroundStory NVARCHAR(MAX),
    RegionID INT,
    CONSTRAINT FK_Characters_Regions FOREIGN KEY (RegionID) REFERENCES Regions(RegionID)
);
GO

-- Create the Superpowers table
CREATE TABLE Superpowers (
    PowerID INT PRIMARY KEY IDENTITY(1,1),
    PowerName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX)
);
GO

-- Create the CharacterSuperpowers junction table
CREATE TABLE CharacterSuperpowers (
    CharacterID INT,
    PowerID INT,
    ProficiencyLevel NVARCHAR(50),
    PRIMARY KEY (CharacterID, PowerID),
    CONSTRAINT FK_CharacterSuperpowers_Characters FOREIGN KEY (CharacterID) REFERENCES Characters(CharacterID),
    CONSTRAINT FK_CharacterSuperpowers_Superpowers FOREIGN KEY (PowerID) REFERENCES Superpowers(PowerID)
);
GO

-- Create the Teams table
CREATE TABLE Teams (
    TeamID INT PRIMARY KEY IDENTITY(1,1),
    TeamName NVARCHAR(100) NOT NULL,
    MissionStatement NVARCHAR(MAX)
);
GO

-- Create the CharacterTeams junction table
CREATE TABLE CharacterTeams (
    CharacterID INT,
    TeamID INT,
    JoinDate DATE,
    RoleInTeam NVARCHAR(100),
    PRIMARY KEY (CharacterID, TeamID),
    CONSTRAINT FK_CharacterTeams_Characters FOREIGN KEY (CharacterID) REFERENCES Characters(CharacterID),
    CONSTRAINT FK_CharacterTeams_Teams FOREIGN KEY (TeamID) REFERENCES Teams(TeamID)
);
GO

-- Create the Artifacts table
CREATE TABLE Artifacts (
    ArtifactID INT PRIMARY KEY IDENTITY(1,1),
    ArtifactName NVARCHAR(100) NOT NULL,
    Origin NVARCHAR(100),
    PowersGranted NVARCHAR(MAX),
    CurrentHolderID INT,
    CONSTRAINT FK_Artifacts_Characters FOREIGN KEY (CurrentHolderID) REFERENCES Characters(CharacterID)
);
GO

-- Create the CharacterAlliances table
CREATE TABLE CharacterAlliances (
    CharacterID1 INT,
    CharacterID2 INT,
    AllianceType NVARCHAR(50),
    PRIMARY KEY (CharacterID1, CharacterID2),
    CONSTRAINT FK_CharacterAlliances_Character1 FOREIGN KEY (CharacterID1) REFERENCES Characters(CharacterID),
    CONSTRAINT FK_CharacterAlliances_Character2 FOREIGN KEY (CharacterID2) REFERENCES Characters(CharacterID)
);
GO

SELECT ca.AllianceType, COUNT(DISTINCT cs.PowerID) AS SuperpowerCount
FROM CharacterAlliances ca
JOIN CharacterSuperpowers cs ON cs.CharacterID IN (ca.CharacterID1, ca.CharacterID2)
GROUP BY ca.AllianceType;

SELECT t.TeamName
FROM Teams t
JOIN CharacterTeams ct ON t.TeamID = ct.TeamID
JOIN Artifacts a ON ct.CharacterID = a.CurrentHolderID
GROUP BY t.TeamID, t.TeamName
HAVING COUNT(DISTINCT a.CurrentHolderID) > 1;

SELECT c.CharacterName
FROM Characters c
JOIN Artifacts a ON c.CharacterID = a.CurrentHolderID
JOIN CharacterSuperpowers cs ON c.CharacterID = cs.CharacterID
GROUP BY c.CharacterID, c.CharacterName
HAVING COUNT(DISTINCT a.ArtifactID) > 1 
   AND COUNT(DISTINCT cs.PowerID) > (
       SELECT AVG(SpCount * 1.0) 
       FROM (
           SELECT COUNT(PowerID) AS SpCount 
           FROM CharacterSuperpowers 
           GROUP BY CharacterID
       ) AS AvgSubquery
   );
