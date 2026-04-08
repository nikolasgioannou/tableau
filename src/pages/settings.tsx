import Head from "next/head";
import { useTheme, type ThemeMode } from "~/hooks/use-theme";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

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
              <Select value={mode} onValueChange={(v) => setTheme(v as ThemeMode)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </SettingsRow>
          </div>
        </div>
      </div>
    </>
  );
}
