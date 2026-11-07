import { StatusPage } from "./StatusPage";

export function NotFoundPage() {
  return (
    <StatusPage
      code="404"
      title="We could not find this page"
      message="The link may be old or mistyped."
    />
  );
}
