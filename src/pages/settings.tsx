import Head from "next/head";
import { useTheme, type ThemeMode } from "~/hooks/use-theme";

export default function SettingsPage() {
  const { mode, setTheme } = useTheme();

  return (
    <>
      <Head>
        <title>Settings — Tableau</title>
      </Head>
      <div className="p-8">
        <h1 className="mb-8 text-2xl font-semibold text-text-primary">
          Settings
        </h1>

        <div className="max-w-md space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">
                Appearance
              </p>
              <p className="text-xs text-text-tertiary">
                Choose light or dark mode
              </p>
            </div>
            <select
              value={mode}
              onChange={(e) => setTheme(e.target.value as ThemeMode)}
              className="rounded-md border border-border-default bg-surface-base px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-default"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
}
