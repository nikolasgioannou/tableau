import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const chatRouter = createTRPCRouter({
  getMessages: publicProcedure
    .input(z.object({ presentationId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.chatMessage.findMany({
        where: { presentationId: input.presentationId },
        orderBy: { createdAt: "asc" },
        include: {
          toolCalls: { orderBy: { createdAt: "asc" } },
        },
      });
    }),

  clear: publicProcedure
    .input(z.object({ presentationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.chatMessage.deleteMany({
        where: { presentationId: input.presentationId },
      });
    }),
});
