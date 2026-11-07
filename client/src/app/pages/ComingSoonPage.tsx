import { PageHeader } from "../../components/PageHeader";

// A clear placeholder for pages of the later Objective 3 work (D10).
export function ComingSoonPage({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <p className="text-15 text-text-secondary">
        Coming soon. This page is part of Objective 3 and is not available yet.
      </p>
    </>
  );
}
