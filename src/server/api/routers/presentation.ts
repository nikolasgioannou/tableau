import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const presentationRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    const presentations = await ctx.db.presentation.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { slides: true } },
        slides: {
          orderBy: { index: "asc" },
          take: 1,
          select: { html: true },
        },
      },
    });
    return presentations.map((p) => ({
      id: p.id,
      name: p.name,
      slideCount: p._count.slides,
      firstSlideHtml: p.slides[0]?.html ?? "",
      updatedAt: p.updatedAt,
    }));
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const presentation = await ctx.db.presentation.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          slides: { orderBy: { index: "asc" } },
        },
      });
      return presentation;
    }),

  create: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.presentation.create({
        data: { name: input.name },
      });
    }),

  update: publicProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.presentation.update({
        where: { id: input.id },
        data: { name: input.name },
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.presentation.delete({
        where: { id: input.id },
      });
    }),
});
