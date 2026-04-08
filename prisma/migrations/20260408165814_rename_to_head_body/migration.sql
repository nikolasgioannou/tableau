/*
  Warnings:

  - You are about to drop the column `headHtml` on the `Slide` table. All the data in the column will be lost.
  - You are about to drop the column `html` on the `Slide` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Slide" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "index" INTEGER NOT NULL,
    "head" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "presentationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Slide_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "Presentation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Slide" ("createdAt", "id", "index", "presentationId", "updatedAt") SELECT "createdAt", "id", "index", "presentationId", "updatedAt" FROM "Slide";
DROP TABLE "Slide";
ALTER TABLE "new_Slide" RENAME TO "Slide";
CREATE INDEX "Slide_presentationId_index_idx" ON "Slide"("presentationId", "index");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
