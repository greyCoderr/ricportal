import { Link } from "react-router";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/ui";
import { LABELS } from "../../lib/labels";
import { useCurrentUser } from "../auth/components/guards";
import { EXTRA_LINKS_BY_ROLE, NAV_BY_ROLE } from "../../app/layouts/nav";
import { MySchedulePage } from "../purchase/pages/MySchedulePage";

// Welcome panels. The Parent home is the My Schedule calendar (DEC-024).
export function HomePage() {
  const user = useCurrentUser();

  if (user.role === "PARENT") {
    return <MySchedulePage />;
  }

  const links = [
    ...NAV_BY_ROLE[user.role].filter((item) => item.to !== "/"),
    ...EXTRA_LINKS_BY_ROLE[user.role],
  ];
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
