import { StatusPage } from "./StatusPage";

export function ForbiddenPage() {
  return (
    <StatusPage
      code="403"
      title="You cannot open this page"
      message="Your account does not have access to it. If you need it, ask the Municipal Agriculture Office."
    />
  );
}
