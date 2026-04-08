import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const imageRouter = createTRPCRouter({
  upload: publicProcedure
    .input(
      z.object({
        filename: z.string(),
        mimeType: z.string(),
        base64: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const image = await ctx.db.uploadedImage.create({
        data: {
          filename: input.filename,
          mimeType: input.mimeType,
          base64: input.base64,
        },
      });
      return {
        id: image.id,
        dataUrl: `data:${image.mimeType};base64,${image.base64}`,
      };
    }),
});
