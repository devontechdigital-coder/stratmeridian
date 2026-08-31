import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import AdminClientShell from "@/components/AdminClientShell";

export const metadata = {
  title: "Admin Panel",
  description: "Admin control panel",
};

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Role validation is handled at the component/hook level
  return <AdminClientShell>{children}</AdminClientShell>;
}
