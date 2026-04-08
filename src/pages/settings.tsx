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
        (isLast ? "" : " border-border-default border-b")
      }
    >
      <div className="mr-4">
        <p className="text-text-primary text-sm font-medium">{label}</p>
        <p className="text-text-tertiary text-[13px]">{description}</p>
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
        <title>Settings | Tableau</title>
      </Head>
      <div className="flex h-full justify-center overflow-y-auto py-12">
        <div className="w-full max-w-2xl px-6">
          <h1 className="text-text-primary mb-8 text-xl font-semibold">
            Settings
          </h1>

          <h2 className="text-text-secondary mb-3 text-sm font-medium">
            Appearance
          </h2>
          <div className="border-border-default bg-surface-subtle overflow-hidden rounded-lg border">
            <SettingsRow
              label="Interface theme"
              description="Select your preferred color scheme"
              isLast
            >
              <Select
                value={mode}
                onValueChange={(v) => setTheme(v as ThemeMode)}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
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
