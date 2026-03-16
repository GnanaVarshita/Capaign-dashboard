import React, { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import {
  Card,
  CardTitle,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  InfoBanner,
  cn,
} from "../../components/ui";

export default function SettingsTab() {
  const {
    currentUser,
    updateUser,
    products,
    activities,
    setProducts,
    setActivities,
    toast,
  } = useAppContext();
  const u = currentUser!;

  const [profileForm, setProfileForm] = useState({
    name: u.name,
    phone: u.phone || "",
    email: u.email || "",
  });
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");

  const [newProduct, setNewProduct] = useState("");
  const [newActivity, setNewActivity] = useState("");

  const isAdmin = u.role === "Owner" || u.role === "All India Manager";

  const saveProfile = () => {
    updateUser(u.id, {
      name: profileForm.name,
      phone: profileForm.phone,
      email: profileForm.email,
    });
    toast("Profile updated successfully", "success");
  };

  const changePassword = () => {
    setPwError("");
    if (!pwForm.current) {
      setPwError("Enter current password");
      return;
    }
    if (pwForm.current !== u.password) {
      setPwError("Current password is incorrect");
      return;
    }
    if (!pwForm.next || pwForm.next.length < 6) {
      setPwError("New password must be at least 6 characters");
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError("Passwords do not match");
      return;
    }
    updateUser(u.id, { password: pwForm.next });
    setPwForm({ current: "", next: "", confirm: "" });
    toast("Password changed successfully", "success");
  };

  const addProduct = () => {
    const t = newProduct.trim();
    if (!t) return;
    if (products.includes(t)) {
      toast("Product already exists", "error");
      return;
    }
    setProducts([...products, t]);
    setNewProduct("");
    toast(`Product "${t}" added`, "success");
  };

  const removeProduct = (p: string) => {
    if (!confirm(`Remove product "${p}"? This may affect existing entries.`))
      return;
    setProducts(products.filter((x) => x !== p));
    toast(`Product "${p}" removed`, "success");
  };

  const addActivity = () => {
    const t = newActivity.trim();
    if (!t) return;
    if (activities.includes(t)) {
      toast("Activity already exists", "error");
      return;
    }
    setActivities([...activities, t]);
    setNewActivity("");
    toast(`Activity "${t}" added`, "success");
  };

  const removeActivity = (a: string) => {
    if (!confirm(`Remove activity "${a}"? This may affect existing entries.`))
      return;
    setActivities(activities.filter((x) => x !== a));
    toast(`Activity "${a}" removed`, "success");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="p-6">
        <CardTitle>Profile Information</CardTitle>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label>Full Name</Label>
            <Input
              value={profileForm.name}
              onChange={(e) =>
                setProfileForm((f) => ({ ...f, name: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>Login ID</Label>
            <Input
              value={u.loginId}
              readOnly
              className="bg-[#F9FAFB] text-[#9CA3AF] cursor-not-allowed"
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              type="tel"
              value={profileForm.phone}
              onChange={(e) =>
                setProfileForm((f) => ({ ...f, phone: e.target.value }))
              }
              placeholder="Phone number"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={profileForm.email}
              onChange={(e) =>
                setProfileForm((f) => ({ ...f, email: e.target.value }))
              }
              placeholder="Email address"
            />
          </div>
          <div>
            <Label>Role</Label>
            <Input
              value={u.role}
              readOnly
              className="bg-[#F9FAFB] text-[#9CA3AF] cursor-not-allowed"
            />
          </div>
          <div>
            <Label>Territory</Label>
            <Input
              value={
                [u.territory?.region, u.territory?.zone, u.territory?.area]
                  .filter(Boolean)
                  .join(" · ") ||
                u.territory?.tradeName ||
                "All India"
              }
              readOnly
              className="bg-[#F9FAFB] text-[#9CA3AF] cursor-not-allowed"
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={saveProfile}>Save Profile</Button>
        </div>
      </Card>

      <Card className="p-6">
        <CardTitle>Change Password</CardTitle>
        {pwError && (
          <InfoBanner color="red" className="mt-3">
            <span>⚠ {pwError}</span>
          </InfoBanner>
        )}
        <div className="space-y-4 mt-4">
          <div>
            <Label required>Current Password</Label>
            <Input
              type="password"
              value={pwForm.current}
              onChange={(e) =>
                setPwForm((f) => ({ ...f, current: e.target.value }))
              }
              placeholder="Enter current password"
            />
          </div>
          <div>
            <Label required>New Password</Label>
            <Input
              type="password"
              value={pwForm.next}
              onChange={(e) =>
                setPwForm((f) => ({ ...f, next: e.target.value }))
              }
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <Label required>Confirm New Password</Label>
            <Input
              type="password"
              value={pwForm.confirm}
              onChange={(e) =>
                setPwForm((f) => ({ ...f, confirm: e.target.value }))
              }
              placeholder="Repeat new password"
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={changePassword}>Change Password</Button>
        </div>
      </Card>

      {isAdmin && (
        <>
          <Card className="p-6">
            <CardTitle>Manage Products</CardTitle>
            <p className="text-xs text-[#6B7280] mb-4">
              Products that appear in activity entry forms and allocations.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {products.map((p) => (
                <div
                  key={p}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EBF5FB] border border-[#AED6F1] rounded-lg text-sm font-medium text-[#1B4F72]"
                >
                  {p}
                  <button
                    onClick={() => removeProduct(p)}
                    className="text-[#9CA3AF] hover:text-red-500 font-bold ml-1 text-base leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newProduct}
                onChange={(e) => setNewProduct(e.target.value)}
                placeholder="New product name..."
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && addProduct()}
              />
              <Button onClick={addProduct} disabled={!newProduct.trim()}>
                Add Product
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <CardTitle>Manage Activity Types</CardTitle>
            <p className="text-xs text-[#6B7280] mb-4">
              Activity types that appear in activity entry forms and budget
              allocation.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {activities.map((a) => (
                <div
                  key={a}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FEF9C3] border border-[#FDE68A] rounded-lg text-sm font-medium text-amber-700"
                >
                  {a}
                  <button
                    onClick={() => removeActivity(a)}
                    className="text-[#9CA3AF] hover:text-red-500 font-bold ml-1 text-base leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                placeholder="New activity type..."
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && addActivity()}
              />
              <Button onClick={addActivity} disabled={!newActivity.trim()}>
                Add Activity
              </Button>
            </div>
          </Card>
        </>
      )}

      <Card className="p-6">
        <CardTitle>Data Management</CardTitle>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl border border-[#DDE3ED]">
            <div>
              <p className="font-semibold text-[#374151] text-sm">
                Export Data (JSON)
              </p>
              <p className="text-xs text-[#9CA3AF]">
                Download all dashboard data as a JSON backup.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                const data = JSON.parse(
                  localStorage.getItem("ad_campaign_db") || "{}",
                );
                const blob = new Blob([JSON.stringify(data, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `ad_campaign_backup_${new Date().toISOString().split("T")[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                toast("Data exported", "success");
              }}
            >
              Export JSON
            </Button>
          </div>
          {isAdmin && (
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-200">
              <div>
                <p className="font-semibold text-red-800 text-sm">
                  Reset All Data
                </p>
                <p className="text-xs text-red-600">
                  ⚠ This will clear all entries, bills, and user-created POs.
                  Cannot be undone.
                </p>
              </div>
              <Button
                variant="danger"
                onClick={() => {
                  if (!confirm("Reset ALL data? This cannot be undone!"))
                    return;
                  localStorage.removeItem("ad_campaign_db");
                  window.location.reload();
                }}
              >
                Reset Data
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
