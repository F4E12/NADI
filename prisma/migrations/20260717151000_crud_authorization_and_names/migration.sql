CREATE TABLE IF NOT EXISTS "Device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mac" TEXT NOT NULL,
    "label" TEXT,
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "Device_mac_key" ON "Device"("mac");
CREATE UNIQUE INDEX "Tent_name_nocase_key" ON "Tent"("name" COLLATE NOCASE);
CREATE UNIQUE INDEX "Inventory_name_nocase_key" ON "Inventory"("name" COLLATE NOCASE);
