/*
  Warnings:

  - Added the required column `toolCallId` to the `ChatToolCall` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChatToolCall" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "toolCallId" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "chatMessageId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatToolCall_chatMessageId_fkey" FOREIGN KEY ("chatMessageId") REFERENCES "ChatMessage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ChatToolCall" ("chatMessageId", "createdAt", "id", "input", "output", "toolName") SELECT "chatMessageId", "createdAt", "id", "input", "output", "toolName" FROM "ChatToolCall";
DROP TABLE "ChatToolCall";
ALTER TABLE "new_ChatToolCall" RENAME TO "ChatToolCall";
CREATE INDEX "ChatToolCall_chatMessageId_idx" ON "ChatToolCall"("chatMessageId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
