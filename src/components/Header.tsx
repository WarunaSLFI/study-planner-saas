"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { navigationItems } from "@/components/Sidebar";
import { useNotification } from "@/app/app/providers/NotificationProvider";
import pkg from "../../package.json";

type HeaderProps = {
  title?: string;
};

export default function Header({ title }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [editFirst, setEditFirst] = useState("");
  const [editLast, setEditLast] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const resolvedTitle =
    title ??
    (pathname.startsWith("/app/assignments/")
      ? "Assignment Details"
      : pathname.startsWith("/app/subjects/")
        ? "Subject Details"
        : "Assignment Tracker");

  // Fetch user info on mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        setFirstName(user.user_metadata?.first_name || "");
        setLastName(user.user_metadata?.last_name || "");
      }
    };
    fetchUser();
  }, [supabase]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = firstName && lastName
    ? `${firstName} ${lastName}`
    : firstName || userEmail;

  const initials = firstName && lastName
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : userEmail ? userEmail[0].toUpperCase() : "?";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const openProfile = () => {
    setEditFirst(firstName);
    setEditLast(lastName);
    setSaveSuccess(false);
    setProfileOpen(true);
    setDropdownOpen(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        first_name: editFirst.trim(),
        last_name: editLast.trim(),
      },
    });
    if (!error) {
      setFirstName(editFirst.trim());
      setLastName(editLast.trim());
      setSaveSuccess(true);
      setTimeout(() => {
        setProfileOpen(false);
        setSaveSuccess(false);
      }, 1000);
    }
    setSaving(false);
  };

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-md"
              onClick={() => setMobileMenuOpen(true)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-slate-700">{resolvedTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <NotificationBell />

            {/* User menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(prev => !prev)}
                className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white pl-1.5 pr-3.5 py-1 text-lg font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-medium text-slate-700 border border-slate-200">
                  {initials}
                </span>
                <span className="max-w-[150px] truncate hidden sm:inline-block md:max-w-[200px]">{displayName}</span>
                <svg className={`h-5 w-5 text-slate-400 transition ${dropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg z-50">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-lg font-medium text-slate-700 truncate">{displayName}</p>
                    {firstName && <p className="text-lg text-slate-500 truncate">{userEmail}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={openProfile}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-lg text-slate-700 hover:bg-slate-50 transition"
                  >
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-lg text-red-600 hover:bg-red-50 transition"
                  >
                    <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/40 transition-opacity" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex w-64 flex-col bg-white shadow-xl h-full transform transition-transform">
            <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200">
              <span className="text-xl font-semibold text-slate-700">Study Planner</span>
              <button type="button" onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block rounded-lg px-4 py-3 text-lg font-medium transition ${isActive ? "bg-slate-100 text-slate-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-700"}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-700">Edit Profile</h3>
            <p className="mt-1 text-lg text-slate-500">Update your name. This will be displayed in the app header.</p>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="block text-lg font-medium text-slate-700">Email</span>
                <input
                  type="email"
                  value={userEmail}
                  disabled
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-lg text-slate-500 outline-none cursor-not-allowed"
                />
              </label>
              <label className="block">
                <span className="block text-lg font-medium text-slate-700">First Name</span>
                <input
                  type="text"
                  value={editFirst}
                  onChange={(e) => setEditFirst(e.target.value)}
                  placeholder="Enter your first name"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-lg text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="block">
                <span className="block text-lg font-medium text-slate-700">Last Name</span>
                <input
                  type="text"
                  value={editLast}
                  onChange={(e) => setEditLast(e.target.value)}
                  placeholder="Enter your last name"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-lg text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              {saveSuccess && (
                <span className="text-lg font-medium text-green-600">Saved ✓</span>
              )}
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-lg font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="rounded-lg bg-slate-600 px-4 py-2.5 text-lg font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NotificationBell() {
  const { permission, requestPermission } = useNotification();

  const getStatusColor = () => {
    return "text-slate-400";
  };

  return (
    <button
      type="button"
      onClick={requestPermission}
      className={`relative p-2 rounded-lg border border-slate-200 bg-white transition hover:bg-slate-50 ${getStatusColor()}`}
      title={permission === "granted" ? "Notifications enabled" : "Enable notifications"}
    >
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {permission === "default" && (
        <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-slate-400 border-2 border-white ring-2 ring-slate-100 animate-pulse" />
      )}
    </button>
  );
}
