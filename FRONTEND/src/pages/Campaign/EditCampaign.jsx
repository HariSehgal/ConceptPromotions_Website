import React, { useEffect, useState } from "react";
import Select from "react-select";
import { FaArrowLeft } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Region & States Mapping
const regionStates = {
  North: ["Jammu and Kashmir", "Ladakh", "Himachal Pradesh", "Punjab", "Haryana", "Uttarakhand", "Uttar Pradesh", "Delhi", "Chandigarh"],
  South: ["Andhra Pradesh", "Karnataka", "Kerala", "Tamil Nadu", "Telangana", "Puducherry", "Lakshadweep"],
  East: ["Bihar", "Jharkhand", "Odisha", "West Bengal", "Sikkim", "Andaman and Nicobar Islands", "Arunachal Pradesh", "Assam", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Tripura"],
  West: ["Rajasthan", "Gujarat", "Maharashtra", "Madhya Pradesh", "Goa", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu"],
};

// Dropdown Styles
const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? "#E4002B" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px #E4002B" : "none",
    "&:hover": { borderColor: "#E4002B" },
    minHeight: "45px",
  }),
};

const campaignTypeOptions = [
  { value: "Retailer Enrolment", label: "Retailer Enrolment" },
  { value: "Display Payment", label: "Display Payment" },
  { value: "Incentive Payment", label: "Incentive Payment" },
  { value: "Others", label: "Others" },
];

const regionOptions = [
  { value: "North", label: "North" },
  { value: "South", label: "South" },
  { value: "East", label: "East" },
  { value: "West", label: "West" },
  { value: "All", label: "All" },
];

const EditCampaign = ({ campaignId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    client: "",
    type: "",
    regions: [],
    states: [],
  });

  const API_BASE = "https://conceptpromotions.in";

  const getAllStates = () => {
    const allStates = Object.values(regionStates).flat();
    return allStates.map((state) => ({ value: state, label: state }));
  };

  // Get filtered states based on region
  const getStateOptions = () => {
    if (formData.regions.length === 0) return [];

    if (formData.regions.some((r) => r.value === "All")) return getAllStates();

    const filtered = formData.regions.flatMap((r) => regionStates[r.value] || []);
    return filtered.map((state) => ({ value: state, label: state }));
  };

  const stateOptions = getStateOptions();

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_BASE}/api/admin/campaigns/${campaignId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        const c = data.campaign;

        setFormData({
          name: c.name,
          client: c.client,
          type: campaignTypeOptions.find((t) => t.value === c.type) || null,
          regions: c.regions.map((r) => ({ value: r, label: r })),
          states: c.states.map((s) => ({ value: s, label: s })),
        });

      } catch (err) {
        console.error(err);
        toast.error("Error fetching campaign", { theme: "dark" });
      }
      setLoading(false);
    };

    fetchCampaign();
  }, [campaignId]);

  const handleRegionChange = (selected) => {
    setFormData((prev) => ({
      ...prev,
      regions: selected || [],
      states: selected?.some((r) => r.value === "All")
        ? getAllStates()
        : prev.states.filter((s) =>
            selected.flatMap((r) => regionStates[r.value]).includes(s.value)
          ),
    }));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/api/admin/campaigns/${campaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: formData.name,
          client: formData.client,
          type: formData.type?.value,
          regions: formData.regions.map((r) => r.value),
          states: formData.states.map((s) => s.value),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message, { theme: "dark" });
      } else {
        toast.success("Campaign updated!", { theme: "dark" });
        setTimeout(onBack, 900);
      }
    } catch (err) {
      console.error(err);
      toast.error("Update failed", { theme: "dark" });
    }
    setSaving(false);
  };

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen bg-[#171717] pt-8 px-6 md:px-20 pb-10">
        <button onClick={onBack} className="flex items-center gap-2 text-[#E4002B] mb-6 hover:underline font-medium">
          <FaArrowLeft /> Back
        </button>

        <div className="bg-[#EDEDED] p-6 shadow-md rounded-xl border max-w-3xl mx-auto w-full">
          <h1 className="text-2xl font-bold text-[#E4002B] mb-6 text-center">Edit Campaign</h1>

          {loading ? (
            <p className="text-center">Loading...</p>
          ) : (
            <div className="space-y-5">
              
              <input
                placeholder="Campaign Name"
                className="w-full p-3 border rounded-lg"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />

              <input
                placeholder="Client"
                className="w-full p-3 border rounded-lg"
                value={formData.client}
                onChange={(e) => setFormData({...formData, client: e.target.value})}
              />

              <Select
                styles={customSelectStyles}
                value={formData.type}
                onChange={(v) => setFormData({...formData, type: v})}
                options={campaignTypeOptions}
                placeholder="Select campaign type"
              />

              <Select
                styles={customSelectStyles}
                value={formData.regions}
                onChange={handleRegionChange}
                options={regionOptions}
                isMulti
                placeholder="Select region(s)"
              />

              <Select
                styles={customSelectStyles}
                value={formData.states}
                onChange={(v) => setFormData({...formData, states: v})}
                options={stateOptions}
                isMulti
                placeholder="Select state(s)"
                isDisabled={!formData.regions.length}
              />

              <button
                disabled={saving}
                onClick={handleSave}
                className="w-full py-3 bg-[#E4002B] text-white rounded-lg hover:bg-[#C3002B] transition disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EditCampaign;
