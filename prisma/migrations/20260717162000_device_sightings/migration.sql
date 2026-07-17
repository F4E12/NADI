CREATE TABLE "DeviceSighting" (
    "ip" TEXT NOT NULL PRIMARY KEY,
    "mac" TEXT,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "DeviceSighting_lastSeenAt_idx" ON "DeviceSighting"("lastSeenAt");
