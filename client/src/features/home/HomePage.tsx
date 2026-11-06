import { Link } from "react-router";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/ui";
import { LABELS } from "../../lib/labels";
import { useCurrentUser } from "../auth/components/guards";
import { NAV_BY_ROLE } from "../../app/layouts/nav";

// Welcome panels. The Parent home becomes the My Schedule calendar in S4.
export function HomePage() {
  const user = useCurrentUser();

  if (user.role === "PARENT") {
    return (
      <p className="text-16">
        Welcome, {user.fullName}. Your schedule will appear here once your
        teacher assigns you.
      </p>
    );
  }

  const links = NAV_BY_ROLE[user.role].filter((item) => item.to !== "/");
  return (
    <>
      <PageHeader
        title={`Welcome, ${user.fullName}`}
        description={
          user.role === "ADMIN"
            ? LABELS.admin
            : `${LABELS.teacher}, ${user.centerName ?? ""}`
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((item) => (
          <Card key={item.to}>
            <Link
              to={item.to}
              className="text-16 font-medium text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
            >
              {item.label}
            </Link>
          </Card>
        ))}
      </div>
    </>
  );
}
