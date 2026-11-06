import type { ReactNode } from "react";
import { Button } from "../../components/ui";
import { LABELS } from "../../lib/labels";

type ParentLayoutProps = {
  user: { fullName: string };
  onLogout: () => void;
  children: ReactNode;
};

// Parent screens are roomy, with one task per screen (DESIGN_LANGUAGE rule 5).
export function ParentLayout({ user, onLogout, children }: ParentLayoutProps) {
  return (
    <div className="min-h-screen bg-surface text-text">
      <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between gap-3 bg-header px-4 shadow-header">
        <p className="text-16 font-semibold text-primary">{LABELS.appName}</p>
        <div className="flex items-center gap-3">
          <p className="text-13 font-medium">{user.fullName}</p>
          <Button variant="secondary" icon="log-out" onClick={onLogout}>
            Log out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl p-4">{children}</main>
    </div>
  );
}
