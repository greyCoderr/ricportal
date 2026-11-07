import { Link } from "react-router";

// The one layout of the 403 and 404 pages. Both render inside the app shell.
export function StatusPage({
  code,
  title,
  message,
}: {
  code: string;
  title: string;
  message: string;
}) {
  return (
    <section className="flex flex-col items-start gap-2 py-8">
      <p className="text-48 font-bold text-primary">{code}</p>
      <h1 className="text-24 font-semibold">{title}</h1>
      <p className="max-w-prose text-15 text-text-secondary">{message}</p>
      <Link
        to="/"
        className="mt-2 inline-flex min-h-11 items-center text-15 font-medium text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
      >
        Go to your home page
      </Link>
    </section>
  );
}
