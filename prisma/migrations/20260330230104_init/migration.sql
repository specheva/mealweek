-- CreateTable
CREATE TABLE "Meal" (
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
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT
);

-- CreateTable
CREATE TABLE "MealTag" (
    "mealId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("mealId", "tagId"),
    CONSTRAINT "MealTag_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MealTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealIngredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mealId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" REAL,
    "unit" TEXT,
    "note" TEXT,
    "category" TEXT,
    CONSTRAINT "MealIngredient_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeekPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekStart" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PlanEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekPlanId" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "slot" TEXT NOT NULL DEFAULT 'dinner',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PlanEntry_weekPlanId_fkey" FOREIGN KEY ("weekPlanId") REFERENCES "WeekPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlanEntry_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WeekPlan_weekStart_key" ON "WeekPlan"("weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "PlanEntry_weekPlanId_dayOfWeek_slot_mealId_key" ON "PlanEntry"("weekPlanId", "dayOfWeek", "slot", "mealId");
