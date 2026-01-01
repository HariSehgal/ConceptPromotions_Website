import React, { useState, useEffect, useMemo, useRef } from "react";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

const ClientPassbook = () => {
  const API_BASE_URL = "https://conceptpromotions.in/api";
  const token = localStorage.getItem("client_token");

  // Ref to track if data has been fetched
  const hasFetched = useRef(false);

  // Campaign Status Filter
  const [campaignStatus, setCampaignStatus] = useState({ 
    value: "active", 
    label: "Active" 
  });

  // All Data from APIs
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [budgets, setBudgets] = useState([]);

  // Selected Filters (Multi-select)
  const [selectedStates, setSelectedStates] = useState([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [selectedRetailers, setSelectedRetailers] = useState([]);
  
  // Date Range Filter
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(5);

  // Campaign Status Options
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "all", label: "All Campaigns" },
  ];

  // ===============================
  // FETCH ALL DATA ON MOUNT
  // ===============================
  useEffect(() => {
    // Only fetch if not already fetched
    if (!hasFetched.current) {
      fetchAllData();
      hasFetched.current = true;
    }
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch campaigns
      const campaignsRes = await fetch(
        `${API_BASE_URL}/client/client/campaigns`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const campaignsData = await campaignsRes.json();
      setAllCampaigns(campaignsData.campaigns || []);

      // Fetch all budgets (for passbook data)
      const budgetsRes = await fetch(`${API_BASE_URL}/budgets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const budgetsData = await budgetsRes.json();
      setBudgets(budgetsData.budgets || []);

      toast.success("Data loaded successfully!", { 
        theme: "dark", 
        toastId: "data-loaded" 
      });
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load data", { theme: "dark" });
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // FILTER CAMPAIGNS BY STATUS
  // ===============================
  const filteredCampaigns = useMemo(() => {
    if (campaignStatus.value === "all") return allCampaigns;
    const isActive = campaignStatus.value === "active";
    return allCampaigns.filter((c) => c.isActive === isActive);
  }, [allCampaigns, campaignStatus]);

  // ===============================
  // EXTRACT UNIQUE STATES FROM CAMPAIGNS
  // ===============================
  const stateOptions = useMemo(() => {
    const stateSet = new Set();

    filteredCampaigns.forEach((campaign) => {
      (campaign.assignedRetailers || []).forEach((retailerAssignment) => {
        const state = retailerAssignment.retailerId?.shopDetails?.shopAddress?.state;
        if (state) stateSet.add(state);
      });
    });

    return Array.from(stateSet).map((state) => ({
      value: state,
      label: state,
    }));
  }, [filteredCampaigns]);

  // ===============================
  // EXTRACT CAMPAIGN OPTIONS
  // ===============================
  const campaignOptions = useMemo(() => {
    return filteredCampaigns.map((c) => ({
      value: c._id,
      label: c.name,
      data: c,
    }));
  }, [filteredCampaigns]);

  // ===============================
  // EXTRACT UNIQUE RETAILERS FROM CAMPAIGNS
  // ===============================
  const retailerOptions = useMemo(() => {
    const retailersMap = new Map();

    filteredCampaigns.forEach((campaign) => {
      (campaign.assignedRetailers || []).forEach((retailerAssignment) => {
        const retailer = retailerAssignment.retailerId;
        if (retailer && retailer._id) {
          const retailerId = retailer._id;
          const outletCode = retailer.uniqueId || "N/A";
          const shopName = retailer.shopDetails?.shopName || "N/A";

          if (!retailersMap.has(retailerId)) {
            retailersMap.set(retailerId, {
              value: retailerId,
              label: `${outletCode} - ${shopName}`,
              data: retailer,
            });
          }
        }
      });
    });

    return Array.from(retailersMap.values());
  }, [filteredCampaigns]);

  // ===============================
  // HELPER FUNCTIONS
  // ===============================
  // Helper function to parse date strings (handles both YYYY-MM-DD and dd/mm/yyyy)
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    
    // Check if it's YYYY-MM-DD format (contains dashes)
    if (dateStr.includes('-')) {
      return new Date(dateStr);
    } else if (dateStr.includes('/')) {
      // dd/mm/yyyy format
      const parts = dateStr.split('/');
      if (parts.length !== 3) return null;
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    
    return null;
  };

  // Helper function to format date to dd/mm/yyyy
  const formatDateToDDMMYYYY = (dateStr) => {
    if (!dateStr || dateStr === "N/A") return "N/A";
    
    const date = parseDate(dateStr);
    if (!date || isNaN(date.getTime())) return "N/A";
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  // Helper function to check if date is in range
  const isDateInRange = (dateStr, start, end) => {
    if (!start && !end) return true; // No date filter applied
    
    const date = parseDate(dateStr);
    if (!date || isNaN(date.getTime())) return false; // Invalid date
    
    // Input dates are in YYYY-MM-DD format from HTML date input
    const startDateObj = start ? new Date(start) : null;
    const endDateObj = end ? new Date(end) : null;

    // Set times to start of day for accurate comparison
    date.setHours(0, 0, 0, 0);
    if (startDateObj) startDateObj.setHours(0, 0, 0, 0);
    if (endDateObj) endDateObj.setHours(0, 0, 0, 0);

    if (startDateObj && endDateObj) {
      return date >= startDateObj && date <= endDateObj;
    } else if (startDateObj) {
      return date >= startDateObj;
    } else if (endDateObj) {
      return date <= endDateObj;
    }
    return true;
  };

  // ===============================
  // BUILD PASSBOOK DISPLAY DATA WITH DATE FILTER
  // ===============================
  const allDisplayData = useMemo(() => {
    const data = [];

    // Loop through filtered campaigns
    filteredCampaigns.forEach((campaign) => {
      (campaign.assignedRetailers || []).forEach((retailerAssignment) => {
        const retailer = retailerAssignment.retailerId;
        
        if (!retailer || !retailer._id) return;

        const retailerId = retailer._id;
        const outletCode = retailer.uniqueId || "N/A";
        const shopName = retailer.shopDetails?.shopName || "N/A";
        const state = retailer.shopDetails?.shopAddress?.state || "N/A";

        // Apply State Filter
        if (selectedStates.length > 0) {
          const stateValues = selectedStates.map((s) => s.value);
          if (!stateValues.includes(state)) return;
        }

        // Apply Campaign Filter
        if (selectedCampaigns.length > 0) {
          const campaignIds = selectedCampaigns.map((c) => c.value);
          if (!campaignIds.includes(campaign._id)) return;
        }

        // Apply Retailer Filter
        if (selectedRetailers.length > 0) {
          const retailerIds = selectedRetailers.map((r) => r.value);
          if (!retailerIds.includes(retailerId)) return;
        }

        // Find budget data for this retailer
        const budget = budgets.find((b) => 
          (b.retailerId._id || b.retailerId) === retailerId
        );

        if (budget) {
          // Find campaign-specific budget
          const campaignBudget = budget.campaigns.find(
            (c) => (c.campaignId._id || c.campaignId) === campaign._id
          );

          if (campaignBudget) {
            // Filter installments by date range
            const filteredInstallments = (campaignBudget.installments || []).filter(
              (inst) => isDateInRange(inst.dateOfInstallment, startDate, endDate)
            );

            // Calculate paid amount from filtered installments
            const cPaid = filteredInstallments.reduce((sum, inst) => {
              return sum + (inst.installmentAmount || 0);
            }, 0);

            // Calculate pending
            const cPending = campaignBudget.tca - cPaid;

            // Find the last payment date from filtered installments
            let lastPaymentDate = "N/A";
            if (filteredInstallments.length > 0) {
              const sortedInstallments = [...filteredInstallments].sort((a, b) => {
                const dateA = parseDate(a.dateOfInstallment);
                const dateB = parseDate(b.dateOfInstallment);
                return dateB - dateA; // Descending order
              });
              lastPaymentDate = sortedInstallments[0].dateOfInstallment;
            }

            // If date filter is applied, only show records with matching installments
            // Otherwise show all records
            if ((startDate || endDate) && filteredInstallments.length === 0) {
              return; // Skip this record if no installments match the date filter
            }

            data.push({
              outletCode,
              shopName,
              state,
              campaignName: campaign.name,
              campaignId: campaign._id,
              tca: campaignBudget.tca || 0,
              cPaid,
              cPending,
              lastPaymentDate,
            });
          }
        }
      });
    });

    return data;
  }, [
    filteredCampaigns,
    budgets,
    selectedStates,
    selectedCampaigns,
    selectedRetailers,
    startDate,
    endDate,
  ]);

  // ===============================
  // PAGINATION LOGIC
  // ===============================
  const totalRecords = allDisplayData.length;
  const totalPages = Math.ceil(totalRecords / limit);
  
  const displayData = useMemo(() => {
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    return allDisplayData.slice(startIndex, endIndex);
  }, [allDisplayData, currentPage, limit]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStates, selectedCampaigns, selectedRetailers, startDate, endDate, campaignStatus]);

  // ===============================
  // CALCULATE CARD TOTALS (from all data, not just current page)
  // ===============================
  const cardTotals = useMemo(() => {
    const totalBudget = allDisplayData.reduce((sum, record) => sum + record.tca, 0);
    const totalSpending = allDisplayData.reduce((sum, record) => sum + record.cPaid, 0);
    const totalPending = allDisplayData.reduce((sum, record) => sum + record.cPending, 0);

    return {
      totalBudget,
      totalSpending,
      totalPending,
    };
  }, [allDisplayData]);

  // ===============================
  // PAGINATION FUNCTIONS
  // ===============================
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push("...");
        pageNumbers.push(currentPage - 1);
        pageNumbers.push(currentPage);
        pageNumbers.push(currentPage + 1);
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  // ===============================
  // HANDLE FILTER CHANGES
  // ===============================
  const handleStateChange = (selected) => {
    setSelectedStates(selected || []);
  };

  const handleCampaignChange = (selected) => {
    setSelectedCampaigns(selected || []);
  };

  const handleRetailerChange = (selected) => {
    setSelectedRetailers(selected || []);
  };

  const handleClearAllFilters = () => {
    setSelectedStates([]);
    setSelectedCampaigns([]);
    setSelectedRetailers([]);
    setStartDate("");
    setEndDate("");
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="min-h-screen bg-[#171717] p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-[#E4002B] mb-8">
            Client Passbook
          </h1>

          {loading ? (
            <div className="bg-[#EDEDED] rounded-lg shadow-md p-6">
              <p className="text-gray-600">Loading data...</p>
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="bg-[#EDEDED] rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-700">
                  Filter Options
                </h2>

                {/* Campaign Status Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Status
                  </label>
                  <Select
                    value={campaignStatus}
                    onChange={(selected) => {
                      setCampaignStatus(selected);
                      setSelectedCampaigns([]);
                      setSelectedStates([]);
                      setSelectedRetailers([]);
                    }}
                    options={statusOptions}
                    styles={customSelectStyles}
                    placeholder="Select Status"
                    isSearchable
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* State Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State (Optional)
                    </label>
                    <Select
                      isMulti
                      value={selectedStates}
                      onChange={handleStateChange}
                      options={stateOptions}
                      styles={customSelectStyles}
                      placeholder="Select States"
                      isSearchable
                      isClearable
                    />
                  </div>

                  {/* Campaign Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign (Optional)
                    </label>
                    <Select
                      isMulti
                      value={selectedCampaigns}
                      onChange={handleCampaignChange}
                      options={campaignOptions}
                      styles={customSelectStyles}
                      placeholder="All Campaigns"
                      isSearchable
                      isClearable
                    />
                  </div>

                  {/* Retailer Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Retailer (Optional)
                    </label>
                    <Select
                      isMulti
                      value={selectedRetailers}
                      onChange={handleRetailerChange}
                      options={retailerOptions}
                      styles={customSelectStyles}
                      placeholder="All Retailers"
                      isSearchable
                      isClearable
                    />
                  </div>
                </div>

                {/* Date Range Filter */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:border-transparent"
                    />
                  </div>
                </div>

                {(selectedStates.length > 0 ||
                  selectedCampaigns.length > 0 ||
                  selectedRetailers.length > 0 ||
                  startDate ||
                  endDate) && (
                  <button
                    onClick={handleClearAllFilters}
                    className="mt-4 text-sm text-red-600 underline hover:text-red-800"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>

              {/* Summary Cards - WITHOUT WHITE CIRCLES */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Total Budget Card */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                  <p className="text-sm font-medium opacity-90">Total Budget</p>
                  <h3 className="text-3xl font-bold mt-2">
                    ₹{cardTotals.totalBudget.toLocaleString()}
                  </h3>
                </div>

                {/* Total Spending Card */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                  <p className="text-sm font-medium opacity-90">Total Spending</p>
                  <h3 className="text-3xl font-bold mt-2">
                    ₹{cardTotals.totalSpending.toLocaleString()}
                  </h3>
                </div>

                {/* Total Pending Card */}
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
                  <p className="text-sm font-medium opacity-90">Total Pending</p>
                  <h3 className="text-3xl font-bold mt-2">
                    ₹{cardTotals.totalPending.toLocaleString()}
                  </h3>
                </div>
              </div>

              {/* Passbook Table */}
              <div className="bg-[#EDEDED] rounded-lg shadow-md p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                  <h2 className="text-lg font-semibold text-gray-700">
                    Passbook Records ({totalRecords})
                  </h2>
                  {totalRecords > 0 && (
                    <div className="text-sm text-gray-600">
                      Showing {(currentPage - 1) * limit + 1} to{" "}
                      {Math.min(currentPage * limit, totalRecords)} of{" "}
                      {totalRecords} records
                    </div>
                  )}
                </div>

                {displayData.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                              S.No
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                              State
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                              Outlet Details
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                              Campaign Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                              Total Campaign Amount
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                              Paid
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                              Pending
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                              Last Payment Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {displayData.map((record, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {(currentPage - 1) * limit + index + 1}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {record.state}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-700">
                                    {record.shopName}
                                  </span>
                                  <span className="text-xs text-gray-500 font-mono mt-1">
                                    {record.outletCode}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {record.campaignName}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                                ₹{record.tca.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-green-600">
                                ₹{record.cPaid.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-yellow-600">
                                ₹{record.cPending.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {formatDateToDDMMYYYY(record.lastPaymentDate)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                        <div className="text-sm text-gray-600">
                          Page {currentPage} of {totalPages}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap justify-center">
                          <button
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1}
                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            First
                          </button>

                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            Previous
                          </button>

                          <div className="flex gap-1">
                            {getPageNumbers().map((pageNum, idx) =>
                              pageNum === "..." ? (
                                <span
                                  key={`ellipsis-${idx}`}
                                  className="px-3 py-2 text-gray-500"
                                >
                                  ...
                                </span>
                              ) : (
                                <button
                                  key={pageNum}
                                  onClick={() => handlePageChange(pageNum)}
                                  className={`px-3 py-2 rounded text-sm ${
                                    currentPage === pageNum
                                      ? "bg-[#E4002B] text-white"
                                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              )
                            )}
                          </div>

                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 bg-[#E4002B] text-white rounded hover:bg-[#C3002B] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            Next
                          </button>

                          <button
                            onClick={() => handlePageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 bg-[#E4002B] text-white rounded hover:bg-[#C3002B] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            Last
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 py-4 text-center">
                    No records found for the selected filters.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ClientPassbook;
