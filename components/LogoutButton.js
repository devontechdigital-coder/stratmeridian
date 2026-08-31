"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
    >
      Logout
    </button>
  );
}
