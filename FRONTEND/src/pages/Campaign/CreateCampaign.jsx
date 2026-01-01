import React, { useState } from "react";
import Select from "react-select";
import { FaUser, FaBuilding } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const regionStates = {
  North: [
    "Jammu and Kashmir",
    "Ladakh",
    "Himachal Pradesh",
    "Punjab",
    "Haryana",
    "Uttarakhand",
    "Uttar Pradesh",
    "Delhi",
    "Chandigarh",
  ],
  South: [
    "Andhra Pradesh",
    "Karnataka",
    "Kerala",
    "Tamil Nadu",
    "Telangana",
    "Puducherry",
    "Lakshadweep",
  ],
  East: [
    "Bihar",
    "Jharkhand",
    "Odisha",
    "West Bengal",
    "Sikkim",
    "Andaman and Nicobar Islands",
    "Arunachal Pradesh",
    "Assam",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Tripura",
  ],
  West: [
    "Rajasthan",
    "Gujarat",
    "Maharashtra",
    "Madhya Pradesh",
    "Goa",
    "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu",
  ],
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

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? "#E4002B" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px #E4002B" : "none",
    "&:hover": { borderColor: "#E4002B" },
    minHeight: "42px",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#FEE2E2" : "white",
    color: "#333",
    "&:active": { backgroundColor: "#FECACA" },
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#FEE2E2",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "#E4002B",
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: "#E4002B",
    ":hover": {
      backgroundColor: "#E4002B",
      color: "white",
    },
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 20,
  }),
};

const CreateCampaign = () => {
  const [campaignName, setCampaignName] = useState("");
  const [client, setClient] = useState("");
  const [campaignStartDate, setCampaignStartDate] = useState("");
  const [campaignEndDate, setCampaignEndDate] = useState("");
  const [selectedCampaignType, setSelectedCampaignType] = useState(null);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedStates, setSelectedStates] = useState([]);
  const [loading, setLoading] = useState(false);

  const getAllStates = () => {
    const allStates = Object.values(regionStates).flat();
    return allStates.map((state) => ({
      value: state,
      label: state,
    }));
  };

  const getStateOptions = () => {
    if (selectedRegions.length === 0) {
      return [];
    }

    // If "All" is selected
    if (selectedRegions.some(region => region.value === "All")) {
      return getAllStates();
    }

    // Get states for selected regions
    const filteredStates = selectedRegions.flatMap((region) => {
      return regionStates[region.value] || [];
    });

    return filteredStates.map((state) => ({
      value: state,
      label: state,
    }));
  };

  const stateOptions = getStateOptions();

  const handleRegionChange = (selected) => {
    setSelectedRegions(selected || []);
    
    // If "All" is selected, auto-select all states
    if (selected?.some(region => region.value === "All")) {
      setSelectedStates(getAllStates());
    } else if (selected && selected.length > 0) {
      // Filter out states that don't belong to selected regions
      const validStateValues = selected.flatMap(
        (region) => regionStates[region.value] || []
      );
      const filteredStates = selectedStates.filter((state) =>
        validStateValues.includes(state.value)
      );
      setSelectedStates(filteredStates);
    } else {
      setSelectedStates([]);
    }
  };

  const resetForm = () => {
    setCampaignName("");
    setClient("");
    setSelectedCampaignType(null);
    setSelectedRegions([]);
    setSelectedStates([]);
    setCampaignStartDate("");
    setCampaignEndDate("");
  };

  const handleSubmit = async () => {
    setLoading(true);

    if (!campaignName || !client || !selectedCampaignType || selectedRegions.length === 0 || selectedStates.length === 0 || !campaignStartDate || !campaignEndDate) {
      toast.error("All fields are required!", { theme: "dark" });
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("https://conceptpromotions.in/api/admin/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: campaignName,
          client,
          type: selectedCampaignType.value,
          regions: selectedRegions.map(r => r.value),
          states: selectedStates.map(s => s.value),
          campaignStartDate,
          campaignEndDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Error creating campaign", { theme: "dark" });
      } else {
        toast.success("Campaign created successfully!", { theme: "dark" });
        resetForm();
      }
    } catch (error) {
      console.error(error);
      toast.error("Server error", { theme: "dark" });
    }
    setLoading(false);
  };

  return (
    <>
      <ToastContainer />

      <div className="w-full max-w-lg bg-[#EDEDED] shadow-md rounded-xl p-8 mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#E4002B]">Create a Campaign</h1>
        </div>

        <div className="space-y-5">
          {/* Campaign Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Campaign Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FaUser className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Type campaign name here"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
              />
            </div>
          </div>

          {/* Client */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Client <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FaBuilding className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Client Name"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
              />
            </div>
          </div>

          {/* Type of Campaign */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              Type of Campaign <span className="text-red-500">*</span>
            </label>
            <Select
              styles={customSelectStyles}
              options={campaignTypeOptions}
              value={selectedCampaignType}
              onChange={setSelectedCampaignType}
              isSearchable
              placeholder="Select campaign type"
            />
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              Region <span className="text-red-500">*</span>
            </label>
            <Select
              styles={customSelectStyles}
              options={regionOptions}
              value={selectedRegions}
              onChange={handleRegionChange}
              isSearchable
              isMulti
              placeholder="Select regions"
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              State <span className="text-red-500">*</span>
            </label>
            <Select
              styles={customSelectStyles}
              options={stateOptions}
              value={selectedStates}
              onChange={setSelectedStates}
              isSearchable
              isMulti
              placeholder={selectedRegions.length > 0 ? "Select states" : "Select region first"}
              isDisabled={selectedRegions.length === 0}
            />
          </div>

          {/* Campaign Start Date */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={campaignStartDate}
              onChange={(e) => setCampaignStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
            />
          </div>

          {/* Campaign End Date */}
          <div>
            <label className="block text-sm font-medium mb-1">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={campaignEndDate}
              onChange={(e) => setCampaignEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#E4002B]"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#E4002B] text-white py-2 rounded-lg font-medium hover:bg-[#C3002B] transition mb-10 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Campaign"}
          </button>
        </div>
      </div>
    </>
  );
};

export default CreateCampaign;