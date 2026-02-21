"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinkProps = {
  href: string;
  label: string;
};

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavLink({ href, label }: NavLinkProps) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`block rounded-lg px-3 py-2 font-medium transition-colors ${active ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 " }`}
 >
      {label}
    </Link>
  );
}
