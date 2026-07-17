-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mac" TEXT NOT NULL,
    "label" TEXT,
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Complaint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "freeText" TEXT NOT NULL,
    "symptoms" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'VOLUNTEER',
    "suggestedPriority" TEXT NOT NULL,
    "confirmedPriority" TEXT,
    "confirmedBy" TEXT,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "residentId" TEXT NOT NULL,
    CONSTRAINT "Complaint_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Complaint" ("confirmedBy", "confirmedPriority", "createdAt", "freeText", "id", "residentId", "resolvedAt", "suggestedPriority", "symptoms") SELECT "confirmedBy", "confirmedPriority", "createdAt", "freeText", "id", "residentId", "resolvedAt", "suggestedPriority", "symptoms" FROM "Complaint";
DROP TABLE "Complaint";
ALTER TABLE "new_Complaint" RENAME TO "Complaint";
CREATE INDEX "Complaint_residentId_idx" ON "Complaint"("residentId");
CREATE INDEX "Complaint_resolvedAt_idx" ON "Complaint"("resolvedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Device_mac_key" ON "Device"("mac");
