import React, { useState, useEffect } from "react";
import axios from "axios";

import Info from "./Info";
import Gratification from "./Gratification";
import Report from "./EmployeeViewReports";
import Period from "./Period";
import Status from "./Status";
import OutletsAssigned from "./OutletsAssigned";
import SubmitReport from "./SubmitReport";

const CampaignDetails = ({ campaign, onBack }) => {
  const [campaignData, setCampaignData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("info");

  const API_BASE_URL = "https://conceptpromotions.in/api";

  // Fetch full campaign details on mount
  useEffect(() => {
    const fetchCampaignDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        if (!token) {
          setError("No authentication token found. Please login.");
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${API_BASE_URL}/employee/campaigns/${campaign._id}/status`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        setCampaignData(response.data);

      } catch (err) {
        console.error("Fetch campaign details error:", err);
        setError(err.response?.data?.message || "Failed to fetch campaign details");
      } finally {
        setLoading(false);
      }
    };

    if (campaign?._id) {
      fetchCampaignDetails();
    }
  }, [campaign]);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return "Invalid date";
    }
  };

  // Prepare campaign object for child components
  const campaignForComponents = campaignData ? {
    name: campaignData.name,
    startDate: formatDate(campaignData.employeeStatus?.startDate || campaignData.campaignStartDate),
    endDate: formatDate(campaignData.employeeStatus?.endDate || campaignData.campaignEndDate),
    client: campaignData.client,
    type: campaignData.type,
    status: campaignData.employeeStatus?.status || 'pending',
    isActive: campaignData.isActive,
    regions: campaignData.regions,
    states: campaignData.states,
    createdBy: campaignData.createdBy,
    assignedAt: campaignData.employeeStatus?.assignedAt,
    updatedAt: campaignData.employeeStatus?.updatedAt,
    // Add any other fields your child components need
  } : null;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg text-gray-600">Loading campaign details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <button
          onClick={onBack}
          className="mb-4 text-[#E4002B] font-medium hover:underline"
        >
          ← Back
        </button>
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!campaignData) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <button
          onClick={onBack}
          className="mb-4 text-[#E4002B] font-medium hover:underline"
        >
          ← Back
        </button>
        <p>No campaign found.</p>
      </div>
    );
  }

  const tabComponents = {
    info: <Info campaign={campaignForComponents} />,
    gratification: <Gratification campaign={campaignForComponents} />,
    report: <Report campaign={campaignForComponents} />,
    period: <Period campaign={campaignForComponents} />,
    status: <Status campaign={campaignForComponents} />,
    OutletsAssigned: <OutletsAssigned campaign={campaignForComponents} />,
    submitReport: <SubmitReport campaign={campaignForComponents} />,
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      {/* Back */}
      <button
        onClick={onBack}
        className="mb-4 text-[#E4002B] font-medium hover:underline"
      >
        ← Back
      </button>

      {/* Heading */}
      <h2 className="text-2xl font-bold text-[#E4002B] mb-6">
        {campaignData.name}
      </h2>

      {/* Submit Report Button under heading */}
      <button
        onClick={() => setActiveTab("submitReport")}
        className="px-4 py-2 rounded-lg bg-[#E4002B] text-white font-medium shadow-md hover:bg-[#c60025] mb-4"
      >
        Submit Report
      </button>

      {/* Black separation line */}
      <div className="w-full h-[1px] bg-black mb-6"></div>

      {/* 3×2 Grid Buttons */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { key: "info", label: "Info" },
          { key: "gratification", label: "Gratification" },
          { key: "report", label: "View Report" },
          { key: "period", label: "Period" },
          { key: "status", label: "Status" },
          { key: "OutletsAssigned", label: "Outlets Assigned" },
        ].map((item) => (
          <button
            key={item.key}
            className={`p-4 border rounded-lg text-center shadow-sm font-medium
              ${activeTab === item.key ? "bg-[#E4002B] text-white" : "hover:shadow-md"}`}
            onClick={() => setActiveTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* CONTENT SECTION */}
      <div className="mt-6 border-2 border-[#E4002B] rounded-lg p-6">
        {tabComponents[activeTab]}
      </div>
    </div>
  );
};

export default CampaignDetails;