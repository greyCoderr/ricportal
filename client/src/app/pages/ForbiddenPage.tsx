import { Link } from "react-router";

export function ForbiddenPage() {
  return (
    <section className="flex flex-col items-start gap-2 p-4">
      <h1 className="text-24 font-semibold">You cannot open this page</h1>
      <p className="text-15 text-text-secondary">
        Your account does not have access to it. If you need it, ask the
        Municipal Agriculture Office.
      </p>
      <Link to="/" className="text-15 font-medium text-primary underline">
        Go to your home page
      </Link>
    </section>
  );
}
