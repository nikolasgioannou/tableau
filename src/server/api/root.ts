import { chatRouter } from "~/server/api/routers/chat";
import { presentationRouter } from "~/server/api/routers/presentation";
import { slideRouter } from "~/server/api/routers/slide";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  presentation: presentationRouter,
  slide: slideRouter,
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
