-- CreateTable
CREATE TABLE "Tent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "maxCapacity" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "qrPayload" TEXT NOT NULL,
    "fallbackCode" TEXT NOT NULL,
    "tentId" TEXT NOT NULL,
    CONSTRAINT "Household_tentId_fkey" FOREIGN KEY ("tentId") REFERENCES "Tent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Resident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "nik" TEXT,
    "isPregnant" BOOLEAN NOT NULL DEFAULT false,
    "healthStatus" TEXT NOT NULL DEFAULT 'WELL',
    "householdId" TEXT NOT NULL,
    CONSTRAINT "Resident_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChronicCondition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    CONSTRAINT "ChronicCondition_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "kcalPerUnit" REAL NOT NULL DEFAULT 0,
    "isHighProtein" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "TentAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quantity" REAL NOT NULL,
    "tentId" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    CONSTRAINT "TentAllocation_tentId_fkey" FOREIGN KEY ("tentId") REFERENCES "Tent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TentAllocation_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TransactionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "actor" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "householdId" TEXT,
    "allocationId" TEXT,
    CONSTRAINT "TransactionLog_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TransactionLog_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "TentAllocation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "freeText" TEXT NOT NULL,
    "symptoms" TEXT NOT NULL,
    "suggestedPriority" TEXT NOT NULL,
    "confirmedPriority" TEXT,
    "confirmedBy" TEXT,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "residentId" TEXT NOT NULL,
    CONSTRAINT "Complaint_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Tent_name_key" ON "Tent"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Household_qrPayload_key" ON "Household"("qrPayload");

-- CreateIndex
CREATE UNIQUE INDEX "Household_fallbackCode_key" ON "Household"("fallbackCode");

-- CreateIndex
CREATE INDEX "Household_tentId_idx" ON "Household"("tentId");

-- CreateIndex
CREATE INDEX "Household_name_idx" ON "Household"("name");

-- CreateIndex
CREATE INDEX "Resident_householdId_idx" ON "Resident"("householdId");

-- CreateIndex
CREATE INDEX "Resident_nik_idx" ON "Resident"("nik");

-- CreateIndex
CREATE INDEX "Resident_name_idx" ON "Resident"("name");

-- CreateIndex
CREATE INDEX "ChronicCondition_residentId_idx" ON "ChronicCondition"("residentId");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_name_key" ON "Inventory"("name");

-- CreateIndex
CREATE INDEX "TentAllocation_tentId_idx" ON "TentAllocation"("tentId");

-- CreateIndex
CREATE UNIQUE INDEX "TentAllocation_tentId_inventoryId_key" ON "TentAllocation"("tentId", "inventoryId");

-- CreateIndex
CREATE INDEX "TransactionLog_householdId_createdAt_idx" ON "TransactionLog"("householdId", "createdAt");

-- CreateIndex
CREATE INDEX "TransactionLog_createdAt_idx" ON "TransactionLog"("createdAt");

-- CreateIndex
CREATE INDEX "Complaint_residentId_idx" ON "Complaint"("residentId");

-- CreateIndex
CREATE INDEX "Complaint_resolvedAt_idx" ON "Complaint"("resolvedAt");
