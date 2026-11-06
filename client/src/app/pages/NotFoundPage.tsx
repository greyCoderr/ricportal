import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <section className="flex flex-col items-start gap-2 p-4">
      <h1 className="text-24 font-semibold">We could not find this page</h1>
      <p className="text-15 text-text-secondary">
        The link may be old or mistyped.
      </p>
      <Link to="/" className="text-15 font-medium text-primary underline">
        Go to your home page
      </Link>
    </section>
  );
}
