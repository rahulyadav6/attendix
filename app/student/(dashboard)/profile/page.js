"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import toast from "react-hot-toast";

export default function StudentProfile() {
  const { student } = useAuth();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [livePhoto, setLivePhoto] = useState(student?.photo || "");

  useEffect(() => {
    // Always fetch the freshest profile data from the server directly
    api.get("/student/me").then(({ data }) => {
      if (data?.student?.photo) {
        setLivePhoto(data.student.photo);
      }
    }).catch(err => console.error(err));

    let socket;
    import('socket.io-client').then(({ io }) => {
      socket = io(process.env.NEXT_PUBLIC_APP_URL || "", { path: "/api/socket" });
      if (student?._id) {
        socket.emit("join_student", student._id);
      }
      socket.on("profile_updated", (data) => {
        if (data.photo) setLivePhoto(data.photo);
      });
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [student?._id]);


  async function handleChangePassword(e) {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword) {
      toast.error("Both passwords are required"); return;
    }
    if (form.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters"); return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Passwords do not match"); return;
    }
    setSaving(true);
    try {
      await api.post("/student/password", { currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success("Password changed successfully!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update password");
    } finally { setSaving(false); }
  }


  const initials = (name) => name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div style={{ padding: "32px 36px", maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--gray-900)", marginBottom: 4 }}>My Profile</h1>
      <p style={{ fontSize: 13, color: "var(--gray-400)", marginBottom: 28 }}>View and manage your account settings</p>

      {/* Profile Card */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid var(--gray-200)", padding: "24px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          {livePhoto ? (
            <img src={livePhoto} alt="" style={{ width: 70, height: 70, borderRadius: 20, objectFit: "cover", border: "3px solid var(--teal-50)" }} />
          ) : (
            <div style={{ width: 70, height: 70, borderRadius: 20, background: "var(--teal-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "var(--teal-800)", border: "3px solid var(--teal-50)" }}>
              {initials(student?.name)}
            </div>
          )}
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "var(--gray-900)" }}>{student?.name}</div>
            <div style={{ fontSize: 12, color: "var(--gray-400)", fontFamily: "'DM Mono', monospace", marginTop: 3 }}>
              {student?.studentId}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
          {[
            ["Full Name", student?.name],
            ["Student ID", student?.studentId],
            ["Email Address", student?.email],
            ["Account Type", "Student"],
          ].map(([label, value], i) => (
            <div key={label} style={{ padding: "14px 0", borderBottom: "1px solid var(--gray-100)", paddingRight: 20 }}>
              <div style={{ fontSize: 11, color: "var(--gray-400)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14, color: "var(--gray-900)", fontWeight: 500 }}>{value || "—"}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Change Password Card */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid var(--gray-200)", padding: "24px" }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--gray-900)", marginBottom: 4 }}>Change Password</h2>
        <p style={{ fontSize: 13, color: "var(--gray-400)", marginBottom: 20 }}>You need your current password to set a new one.</p>

        <form onSubmit={handleChangePassword}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { key: "currentPassword", label: "Current Password", placeholder: "Enter current password" },
              { key: "newPassword",     label: "New Password",     placeholder: "Min. 6 characters" },
              { key: "confirmPassword", label: "Confirm New Password", placeholder: "Repeat new password" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--gray-700)", marginBottom: 6 }}>{label}</label>
                <input
                  type="password"
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--gray-200)", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "'DM Sans', system-ui, sans-serif", color: "var(--gray-900)", boxSizing: "border-box", transition: "border-color 0.15s" }}
                  onFocus={(e) => e.target.style.borderColor = "var(--teal-400)"}
                  onBlur={(e)  => e.target.style.borderColor = "var(--gray-200)"}
                />
              </div>
            ))}
            <div>
              <button
                type="submit"
                disabled={saving}
                style={{ padding: "10px 24px", background: saving ? "var(--teal-600)" : "var(--teal-400)", border: "none", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', system-ui, sans-serif" }}
              >
                {saving ? "Updating…" : "Update Password"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
