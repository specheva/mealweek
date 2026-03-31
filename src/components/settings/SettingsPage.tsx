"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

interface UserInfo {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface HouseholdInfo {
  id: string;
  name: string;
  members: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  }[];
}

interface SettingsPageProps {
  user: UserInfo;
  household: HouseholdInfo | null;
}

export function SettingsPage({ user, household }: SettingsPageProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    setInviteStatus(null);

    try {
      const res = await fetch("/api/household/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setInviteStatus({
          type: "success",
          message: data.message || "Invite sent successfully!",
        });
        setInviteEmail("");
      } else {
        setInviteStatus({
          type: "error",
          message: data.error || "Failed to send invite.",
        });
      }
    } catch {
      setInviteStatus({
        type: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setIsInviting(false);
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-stone-900">Settings</h1>

      {/* Profile section */}
      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-stone-800">Profile</h2>
        <div className="flex items-center gap-4">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || "User avatar"}
              className="h-14 w-14 rounded-full border-2 border-stone-100"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
              {(user.name || user.email)[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-base font-medium text-stone-900">
              {user.name || "Unnamed"}
            </p>
            <p className="text-sm text-stone-500">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-4 rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-800"
        >
          Sign Out
        </button>
      </section>

      {/* Household section */}
      {household && (
        <section className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-stone-800">
            Household
          </h2>
          <p className="mb-4 text-sm text-stone-500">
            <span className="font-medium text-stone-700">
              {household.name}
            </span>
          </p>

          {/* Members list */}
          <div className="mb-6 space-y-3">
            <h3 className="text-sm font-medium text-stone-600">Members</h3>
            {household.members.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name || "Member avatar"}
                    className="h-9 w-9 rounded-full border border-stone-100"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
                    {(member.name || member.email)[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-stone-800">
                    {member.name || "Pending"}
                  </p>
                  <p className="text-xs text-stone-400">{member.email}</p>
                </div>
                {member.id === user.id && (
                  <span className="ml-auto rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                    You
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Invite partner */}
          <div className="border-t border-stone-100 pt-4">
            <h3 className="mb-2 text-sm font-medium text-stone-600">
              Invite Partner
            </h3>
            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                type="email"
                placeholder="partner@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="submit"
                disabled={isInviting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInviting ? "Sending..." : "Send Invite"}
              </button>
            </form>

            {inviteStatus && (
              <p
                className={`mt-2 text-sm ${
                  inviteStatus.type === "success"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {inviteStatus.message}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
