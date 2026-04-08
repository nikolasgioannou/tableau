import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const slideRouter = createTRPCRouter({
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        head: z.string().optional(),
        body: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.slide.update({
        where: { id: input.id },
        data: {
          ...(input.body !== undefined && { body: input.body }),
          ...(input.head !== undefined && { head: input.head }),
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string(), presentationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.slide.delete({ where: { id: input.id } });
      const remaining = await ctx.db.slide.findMany({
        where: { presentationId: input.presentationId },
        orderBy: { index: "asc" },
      });
      await ctx.db.$transaction(
        remaining.map((slide, i) =>
          ctx.db.slide.update({
            where: { id: slide.id },
            data: { index: i },
          }),
        ),
      );
    }),
});
