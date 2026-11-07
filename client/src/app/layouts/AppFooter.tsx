import type { Role } from "@ricportal/shared";
import { Link } from "react-router";
import dswdLogo from "../../assets/footer-dswd.png";
import facebookIcon from "../../assets/footer-facebook.png";
import gmailIcon from "../../assets/footer-gmail.png";
import maoLogo from "../../assets/footer-mao.png";
import sealLogos from "../../assets/footer-seal.png";
import emblem from "../../assets/ric-emblem.png";
import { NAV_BY_ROLE } from "./nav";

// Texts as in Figma 268:10479. The year is the real one (DEC-037; Figma has
// 2025). The tagline uses Montserrat: Figma's Mozilla Headline is not installed.
export const COPYRIGHT = "© 2026 RICPortal — Rural Improvement Club.";
const EMAIL = "maolibmanan4407@gmail.com";
const PHONES = ["(054) 511-8332", "(054) 511-8198"];

const LINK_FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nav-text";

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^0-9]/g, "")}`;
}

// The Admin frames show one copyright line (267:9689); the Teacher frames show
// the full black footer (268:10479). Parent frames have none, so a Parent gets
// the Teacher footer (D13).
export function AppFooter({ role }: { role: Role }) {
  if (role === "ADMIN") {
    return (
      <footer className="mt-auto shrink-0 px-4 py-4 text-center text-13 tracking-label text-text-secondary compact:py-2">
        {COPYRIGHT}
      </footer>
    );
  }

  return (
    <footer className="mt-auto shrink-0 bg-nav px-4 py-6 text-nav-text lg:px-5 compact:py-2">
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-[1fr_1.4fr_auto_auto_auto] compact:grid-cols-[auto_1fr_auto_auto] compact:gap-x-8 compact:gap-y-1">
        <div>
          <div className="flex items-center gap-3">
            <img
              src={emblem}
              alt="Rural Improvement Club emblem"
              className="size-[3.75rem] shrink-0 rounded-full object-cover compact:size-10"
            />
            <div>
              <p className="text-20 tracking-label">
                <span className="text-primary">RIC</span>Portal
              </p>
              <p className="text-12 tracking-label">Rural Improvement Club</p>
              <p className="text-12 tracking-label">Libmanan, Camarines Sur</p>
            </div>
          </div>
          <p className="mt-3 text-10 tracking-label compact:mt-1">
            A better way to connect each other.
          </p>
        </div>

        <div className="compact:order-last compact:col-span-full compact:flex compact:flex-wrap compact:items-center compact:gap-x-4">
          <div className="flex flex-wrap items-center gap-3">
            <img
              src={dswdLogo}
              alt="Department of Social Welfare and Development logo"
              className="h-[3.625rem] w-auto compact:h-6"
            />
            <img
              src={sealLogos}
              alt="Municipal seal and Rural Improvement Club emblem"
              className="h-[3.625rem] w-auto compact:h-6"
            />
            <img
              src={maoLogo}
              alt="Municipal Agriculture Office logo"
              className="h-[3.625rem] w-auto compact:h-6"
            />
          </div>
          <p className="mt-3 text-12 font-medium tracking-label compact:mt-0 compact:text-11 compact:tracking-normal">
            MUNICIPAL COUNCIL FOR THE PROTECTION OF CHILDREN
          </p>
          <p className="text-10 font-medium tracking-label compact:tracking-normal">
            thru the OFFICE OF THE MUNICIPAL MAYOR
          </p>
          <p className="mt-3 text-12 font-medium tracking-label compact:mt-0 compact:text-11 compact:tracking-normal">
            MUNICIPAL SOCIAL WELFARE &amp; DEVELOPMENT OFFICE
          </p>
        </div>

        <nav aria-labelledby="footer-quick-links">
          <h2
            id="footer-quick-links"
            className="text-15 font-normal tracking-label"
          >
            Quick links
          </h2>
          <ul className="mt-1 flex flex-col compact:grid compact:grid-flow-col compact:grid-rows-4 compact:gap-x-4">
            {NAV_BY_ROLE[role].map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={`inline-flex min-h-11 items-center text-13 tracking-label lg:min-h-8 compact:min-h-4 ${LINK_FOCUS}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-15 font-normal tracking-label">Location</h2>
          <address className="mt-2 flex flex-col gap-2 compact:mt-1 compact:gap-0 text-12 not-italic tracking-label">
            <span>Station-Church Site</span>
            <span>Libmanan, Philippines</span>
            <span>4407</span>
          </address>
        </div>

        <div>
          <h2 className="text-15 font-normal tracking-label">Contact</h2>
          <div className="mt-2 flex items-center gap-3 compact:mt-0">
            <img
              src={facebookIcon}
              alt="Facebook"
              className="size-[1.875rem] compact:size-4"
            />
            <img
              src={gmailIcon}
              alt="Gmail"
              className="size-[1.875rem] compact:size-4"
            />
          </div>
          <ul className="mt-2 flex flex-col text-12 font-medium tracking-label compact:mt-1">
            {PHONES.map((phone) => (
              <li key={phone}>
                <a
                  href={telHref(phone)}
                  className={`inline-flex min-h-11 items-center lg:min-h-6 compact:min-h-4 ${LINK_FOCUS}`}
                >
                  {phone}
                </a>
              </li>
            ))}
            <li>
              <a
                href={`mailto:${EMAIL}`}
                className={`inline-flex min-h-11 items-center break-all lg:min-h-6 compact:min-h-4 compact:break-normal ${LINK_FOCUS}`}
              >
                {EMAIL}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <p className="mt-8 text-center text-13 tracking-label compact:mt-1">
        {COPYRIGHT}
      </p>
    </footer>
  );
}
