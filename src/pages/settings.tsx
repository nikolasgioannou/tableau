import Head from "next/head";
import { useTheme, type ThemeMode } from "~/hooks/use-theme";

function SettingsRow({
  label,
  description,
  children,
  isLast = false,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div
      className={
        "flex items-center justify-between px-5 py-4" +
        (isLast ? "" : " border-b border-border-default")
      }
    >
      <div className="mr-4">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-[13px] text-text-tertiary">{description}</p>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { mode, setTheme } = useTheme();

  return (
    <>
      <Head>
        <title>Settings — Tableau</title>
      </Head>
      <div className="flex h-full justify-center overflow-y-auto py-12">
        <div className="w-full max-w-2xl px-6">
          <h1 className="mb-8 text-xl font-semibold text-text-primary">
            Settings
          </h1>

          <h2 className="mb-3 text-sm font-medium text-text-secondary">
            Appearance
          </h2>
          <div className="overflow-hidden rounded-lg border border-border-default bg-surface-subtle">
            <SettingsRow
              label="Interface theme"
              description="Select your preferred color scheme"
              isLast
            >
              <select
                value={mode}
                onChange={(e) => setTheme(e.target.value as ThemeMode)}
                className="rounded-md border border-border-default bg-surface-base px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-default"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </SettingsRow>
          </div>
        </div>
      </div>
    </>
  );
}
