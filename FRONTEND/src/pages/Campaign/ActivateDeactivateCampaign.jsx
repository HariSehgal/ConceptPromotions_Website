import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ActivateDeactivateCampaign = ({ campaignId, onBack }) => {
  const [campaign, setCampaign] = useState(null);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  const API_BASE = "https://conceptpromotions.in";

  // ✅ Fetch Campaign details
  const fetchCampaignDetails = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/api/admin/campaigns/${campaignId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Unable to fetch campaign", { theme: "dark" });
        return;
      }

      setCampaign(data.campaign);
      setStatus(data.campaign.isActive ? "active" : "inactive");
    } catch (err) {
      console.log("Error:", err);
      toast.error("Something went wrong", { theme: "dark" });
    }
  };

  useEffect(() => {
    if (campaignId) fetchCampaignDetails();
  }, [campaignId]);

  // ✅ Update Campaign Status
  const handleStatusUpdate = async () => {
    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/api/admin/campaigns/${campaignId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isActive: status === "active",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Update failed", { theme: "dark" });
      } else {
        setCampaign(data.campaign);
        toast.success("Status updated", { theme: "dark" });
      }
    } catch (err) {
      console.log(err);
      toast.error("Something went wrong", { theme: "dark" });
    }

    setSaving(false);
  };

  if (!campaign) return <p className="text-center mt-10 text-gray-200">Loading...</p>;

  return (
    <div className="bg-[#EDEDED] p-6 shadow-md rounded-xl border max-w-3xl mx-auto w-full">
      <ToastContainer />

      <button
        onClick={onBack}
        className="bg-gray-300 px-3 py-1 mb-4 rounded hover:bg-gray-400"
      >
        Back
      </button>

      <h2 className="text-2xl font-bold text-[#E4002B]">{campaign.name}</h2>
      <p className="text-gray-600 mt-2"><strong>Client:</strong> {campaign.client}</p>
      <p className="text-gray-600"><strong>Region(s):</strong> {campaign.regions.join(", ")}</p>
      <p className="text-gray-600"><strong>State(s):</strong> {campaign.states.join(", ")}</p>
      <p className="mt-2 text-gray-700">{campaign.description}</p>

      <p className="mt-3 text-sm text-gray-500">
        Created: {new Date(campaign.createdAt).toLocaleDateString()}
      </p>

      <div className="mt-6">
        <strong>Status: </strong>

        {/* ✅ Radio Buttons */}
        <div className="flex gap-4 mt-2">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              value="active"
              checked={status === "active"}
              onChange={(e) => setStatus(e.target.value)}
            />
            Active
          </label>

          <label className="flex items-center gap-1">
            <input
              type="radio"
              value="inactive"
              checked={status === "inactive"}
              onChange={(e) => setStatus(e.target.value)}
            />
            Inactive
          </label>
        </div>

        <button
          onClick={handleStatusUpdate}
          disabled={saving}
          className="mt-4 bg-[#E4002B] text-white px-4 py-2 rounded-md disabled:bg-gray-400"
        >
          {saving ? "Updating..." : "Update"}
        </button>
      </div>
    </div>
  );
};

export default ActivateDeactivateCampaign;
