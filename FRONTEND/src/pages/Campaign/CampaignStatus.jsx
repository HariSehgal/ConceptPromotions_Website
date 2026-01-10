import React, { useEffect, useState } from "react";
import Select from "react-select";
import { API_URL } from "../../url/base";

const CampaignStatus = ({ onViewCampaign }) => {
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);

  const [status, setStatus] = useState("active");

  const formatValue = (value) => {
    if (Array.isArray(value)) {
      if (value.length > 5) {
        return value.slice(0, 5).join(", ") + "...";
      }
      return value.join(", ");
    }
    return value || "-";
  };

  // Fetch campaigns
  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/admin/campaigns`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        const campaigns = data.campaigns || [];
        setAllCampaigns(campaigns);

        // Show only active campaigns initially
        setFilteredCampaigns(campaigns.filter((c) => c.isActive === true));
      }
    } catch (err) {
      console.log("Error fetching campaigns:", err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const applyFilters = () => {
    let filtered = [...allCampaigns];
    if (status !== "all") {
      filtered = filtered.filter((c) =>
        status === "active" ? c.isActive === true : c.isActive === false
      );
    }
    setFilteredCampaigns(filtered);
  };

  const resetFilters = () => {
    setStatus("active");
    setFilteredCampaigns([]);
  };

  return (
    <div className="p-6 min-h-screen bg-[#171717]">
      <h2 className="text-2xl font-bold text-[#E4002B] mb-6 text-center">
        Campaign Status
      </h2>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
        <Select
          value={{
            value: status,
            label:
              status === "active"
                ? "Activated"
                : status === "inactive"
                  ? "Deactivated"
                  : "All",
          }}
          onChange={(e) => setStatus(e.value)}
          options={[
            { label: "Activated", value: "active" },
            { label: "Deactivated", value: "inactive" },
            { label: "All", value: "all" },
          ]}
          className="w-48"
          isSearchable
        />

        <button
          onClick={applyFilters}
          className="bg-[#E4002B] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#C3002B] transition"
        >
          Search
        </button>

        <button
          onClick={resetFilters}
          className="text-red-600 font-semibold hover:underline"
        >
          Reset
        </button>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCampaigns.map((c) => (
          <div
            key={c._id}
            className="bg-[#EDEDED] shadow-md rounded-xl border border-gray-200 p-6 hover:shadow-lg transition 
            h-full flex flex-col justify-between"
          >
            <div>
              <h3 className="text-xl font-bold text-gray-900">{c.name}</h3>
              <p className="text-sm text-gray-700"><strong>Client:</strong> {c.client}</p>
              <p className="text-sm text-gray-700"><strong>Regions:</strong> {formatValue(c.regions)}</p>
              <p className="text-sm text-gray-700"><strong>States:</strong> {formatValue(c.states)}</p>

              <p className={`text-sm font-semibold mt-2 ${c.isActive ? "text-green-600" : "text-red-600"
                }`}>
                Status: {c.isActive ? "Active" : "Inactive"}
              </p>
            </div>

            <button
              className="mt-5 bg-[#E4002B] text-white w-full py-2 rounded-lg hover:bg-[#C3002B] transition"
              onClick={() => onViewCampaign(c._id)}
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      {!filteredCampaigns.length && (
        <p className="text-gray-200 text-center mt-8 text-lg">
          No campaigns found. Apply filters & search.
        </p>
      )}
    </div>
  );
};

export default CampaignStatus;
