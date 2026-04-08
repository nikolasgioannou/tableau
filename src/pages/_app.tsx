import { type AppType } from "next/app";
import { Geist, Geist_Mono } from "next/font/google";

import { AppShell } from "~/components/layout/app-shell";
import { ToastProvider } from "~/components/ui/toast";
import { TooltipProvider } from "~/components/ui/tooltip";
import { api } from "~/utils/api";

import "~/styles/globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <div className={`${geist.variable} ${geistMono.variable} font-sans`}>
      <TooltipProvider>
        <ToastProvider>
          <AppShell>
            <Component {...pageProps} />
          </AppShell>
        </ToastProvider>
      </TooltipProvider>
    </div>
  );
};

export default api.withTRPC(MyApp);
