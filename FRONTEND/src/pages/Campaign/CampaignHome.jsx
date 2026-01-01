import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CampaignHome = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "https://conceptpromotions.in/api/admin/campaigns",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Error fetching campaigns", { theme: "dark" });
        return;
      }

      const activeCampaigns = (data.campaigns || []).filter(c => c.isActive === true);
      setCampaigns(activeCampaigns);
    } catch (error) {
      console.error(error);
      toast.error("Server error", { theme: "dark" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const formatValue = (value) => {
    if (Array.isArray(value)) {
      if (value.length > 5) {
        return value.slice(0, 5).join(", ") + "...";
      }
      return value.join(", ");
    }
    return value || "-";
  };


  return (
    <>
      <ToastContainer />

      <div className="w-full p-4">
        <h1 className="text-2xl font-bold text-[#E4002B] mb-6 text-center">
          Campaigns
        </h1>

        {/* Loading */}
        {loading && <p className="text-center text-gray-500 text-lg">Loading...</p>}

        {/* No Data */}
        {!loading && campaigns.length === 0 && (
          <p className="text-center text-gray-500 text-lg">No campaigns found.</p>
        )}

        {/* Card Layout */}
        {!loading && campaigns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {campaigns.map((c) => (
              <div
                key={c._id}
                className="bg-[#EDEDED] shadow-md rounded-xl border border-gray-200 p-6 hover:shadow-lg transition 
  h-full flex flex-col justify-between"
              >
                {/* Title */}
                <h2 className="text-xl font-bold text-gray-800">{c.name}</h2>

                {/* Client */}
                <p className="mt-2 text-gray-600">
                  <strong>Client:</strong> {c.client}
                </p>

                {/* Type */}
                <p className="text-gray-600">
                  <strong>Type:</strong> {c.type}
                </p>

                {/* Region */}
                <p className="text-gray-600">
                  <strong>Region(s):</strong> {formatValue(c.regions)}
                </p>

                {/* State */}
                <p className="text-gray-600">
                  <strong>State(s):</strong> {formatValue(c.states)}
                </p>

                {/* Created By */}
                {c.createdBy?.name && (
                  <p className="text-gray-600">
                    <strong>Created By:</strong> {c.createdBy.name}
                  </p>
                )}

                {/* Divider */}
                <div className="w-full h-[1px] bg-gray-200 my-3"></div>

                {/* Assignment Info */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-600 text-sm">
                      <strong>Employees:</strong>{" "}
                      {c.assignedEmployees?.length || 0}
                    </p>
                    <p className="text-gray-600 text-sm">
                      <strong>Retailers:</strong>{" "}
                      {c.assignedRetailers?.length || 0}
                    </p>
                  </div>

                  {/* View Button */}
                  <button className="bg-[#E4002B] text-white px-4 py-1 rounded-md text-sm hover:bg-[#C3002B]">
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default CampaignHome;
