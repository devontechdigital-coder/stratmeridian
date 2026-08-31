import { getServerSession } from "next-auth";
import connectToDatabase from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import Order from "@/models/Order";
import User from "@/models/User";
import UserProfileForm from "@/components/public/UserProfileForm";

export default async function DashboardProfilePage() {
  const session = await getServerSession(authOptions);
  await connectToDatabase();
  const [orderCount, userDoc, latestOrder] = await Promise.all([
    Order.countDocuments({ user: session.user.id }),
    User.findById(session.user.id).select("name email role phone phoneCountry address city state country").lean(),
    Order.findOne({ user: session.user.id }).sort({ createdAt: -1 }).select("phone phoneCountry address city state country").lean(),
  ]);
  const user = {
    name: userDoc?.name || session.user.name || "",
    email: userDoc?.email || session.user.email || "",
    role: userDoc?.role || session.user.role || "user",
    phone: userDoc?.phone || latestOrder?.phone || "",
    phoneCountry: userDoc?.phoneCountry || latestOrder?.phoneCountry || "US",
    address: userDoc?.address || latestOrder?.address || "",
    city: userDoc?.city || latestOrder?.city || "",
    state: userDoc?.state || latestOrder?.state || "",
    country: userDoc?.country || latestOrder?.country || "",
  };
  const initials = (user.name || user.email || "U").slice(0, 2).toUpperCase();

  return (
    <div className="row g-4">
      <div className="col-lg-4">
        <div className="ud-card text-center">
          <div className="mx-auto mb-4 rounded-circle d-flex align-items-center justify-content-center" style={{ width: 90, height: 90, background: "linear-gradient(135deg,var(--green),var(--cyan))", color: "#000", fontSize: "2rem", fontWeight: 900 }}>{initials}</div>
          <h1 className="h5 mb-1" style={{ color: "#fff" }}>{user.name || "Client"}</h1>
          <p className="text-secondary mb-3">{user.email}</p>
          <span className="ud-badge">Active Client</span>
          <div className="mt-4 pt-3 text-start" style={{ borderTop: "1px solid rgba(255,255,255,.07)" }}>
            <Info label="Total Orders" value={orderCount} />
            <Info label="Role" value={user.role} />
            <Info label="Phone" value={user.phone || "-"} />
            <Info label="City" value={user.city || "-"} />
            <Info label="Country" value={user.country || "-"} />
          </div>
        </div>
      </div>
      <div className="col-lg-8">
        <div className="ud-card">
          <h2 className="ud-card-title mb-4"><i className="bi bi-person-gear me-2" style={{ color: "var(--green)" }} />Profile</h2>
          <style>{`.ud-input{display:block;width:100%;background:rgba(255,255,255,.03)!important;border-color:rgba(198,167,107,.16)!important;color:var(--text-on-dark, #fff)!important;min-height:48px}.ud-input:focus{border-color:rgba(198,167,107,.45)!important;box-shadow:none!important}.ud-input[readonly]{opacity:.65}.ud-input option{background:var(--ink-secondary, #111);color:var(--text-on-dark, #fff)}.ud-input::placeholder{color:#777}.ud-input.form-select{appearance:auto}.ud-profile-address{min-height:112px;resize:vertical}.ud-address-wrap{position:relative}.ud-address-list{position:absolute;z-index:20;left:0;right:0;top:calc(100% + 8px);background:var(--ink-secondary, #111);border:1px solid rgba(198,167,107,.32);border-radius:10px;box-shadow:0 18px 48px rgba(0,0,0,.42);overflow:hidden}.ud-address-item,.ud-address-searching{display:block;width:100%;border:0;background:transparent;color:var(--text-on-dark-mute, #e8e8e8);text-align:left;padding:12px 14px;font-size:.9rem}.ud-address-item:hover{background:rgba(198,167,107,.12);color:var(--text-on-dark, #fff)}.ud-address-searching{color:#888}.ud-address-selected{margin:8px 0 0;color:var(--green);font-size:.8rem;font-weight:700}`}</style>
          <UserProfileForm user={user} />
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return <div className="d-flex justify-content-between py-2"><span className="text-secondary">{label}</span><strong style={{ color: "var(--green)" }}>{value}</strong></div>;
}
