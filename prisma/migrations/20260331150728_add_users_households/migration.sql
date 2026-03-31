-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "householdId" TEXT,
    CONSTRAINT "User_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT 'My Household',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Meal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sourceUrl" TEXT,
    "sourceType" TEXT,
    "imageUrl" TEXT,
    "prepTimeMinutes" INTEGER,
    "cookTimeMinutes" INTEGER,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "cuisine" TEXT,
    "category" TEXT,
    "notes" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isComplete" BOOLEAN NOT NULL DEFAULT true,
    "timesCooked" INTEGER NOT NULL DEFAULT 0,
    "lastCookedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    "householdId" TEXT,
    CONSTRAINT "Meal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Meal_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Meal" ("category", "cookTimeMinutes", "createdAt", "cuisine", "description", "difficulty", "id", "imageUrl", "isComplete", "isFavorite", "lastCookedAt", "notes", "prepTimeMinutes", "sourceType", "sourceUrl", "timesCooked", "title", "updatedAt") SELECT "category", "cookTimeMinutes", "createdAt", "cuisine", "description", "difficulty", "id", "imageUrl", "isComplete", "isFavorite", "lastCookedAt", "notes", "prepTimeMinutes", "sourceType", "sourceUrl", "timesCooked", "title", "updatedAt" FROM "Meal";
DROP TABLE "Meal";
ALTER TABLE "new_Meal" RENAME TO "Meal";
CREATE TABLE "new_WeekPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekStart" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "householdId" TEXT,
    CONSTRAINT "WeekPlan_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WeekPlan" ("createdAt", "id", "weekStart") SELECT "createdAt", "id", "weekStart" FROM "WeekPlan";
DROP TABLE "WeekPlan";
ALTER TABLE "new_WeekPlan" RENAME TO "WeekPlan";
CREATE UNIQUE INDEX "WeekPlan_householdId_weekStart_key" ON "WeekPlan"("householdId", "weekStart");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
