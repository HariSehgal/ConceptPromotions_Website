import React, { useState, useEffect } from "react";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BUSINESS_TYPES = [
  "Grocery Retailer",
  "Wholesale",
  "Key Accounts",
  "Salon / Beauty Parlour",
  "Self Service Outlet",
  "Chemist Outlet",
  "Other",
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
  menu: (provided) => ({
    ...provided,
    zIndex: 20,
  }),
};

const AssignCampaign = () => {
  // Campaign Selection
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  // Assignment Flow
  const [assignType, setAssignType] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);

  // Filters
  const [state, setState] = useState(null);
  const [businessType, setBusinessType] = useState(null);
  const [futureField, setFutureField] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Data
  const [allRetailers, setAllRetailers] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [selectedRetailers, setSelectedRetailers] = useState([]);
  const [loadingRetailers, setLoadingRetailers] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Employee States 
  const [allEmployees, setAllEmployees] = useState([]);
  const [employeeTableData, setEmployeeTableData] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const [employeeState, setEmployeeState] = useState(null);
  const [employeeFutureField1, setEmployeeFutureField1] = useState(null);
  const [employeeFutureField2, setEmployeeFutureField2] = useState(null);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");


  // ✅ Fetch Campaigns
  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Fetch campaigns from backend
  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "https://conceptpromotions.in/api/admin/campaigns",
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Error fetching campaigns", {
          theme: "dark",
        });
        return;
      }

      // Filter Active Campaigns ONLY
      const activeCampaigns = (data.campaigns || []).filter(
        (c) => c.isActive === true
      );

      const campaignOptions = activeCampaigns.map((c) => ({
        value: c._id,
        label: c.name,
        data: c,
      }));

      setCampaigns(campaignOptions);
    } catch (err) {
      console.log("Campaign Fetch Error:", err);
      toast.error("Failed to load campaigns", { theme: "dark" });
    } finally {
      setLoadingCampaigns(false);
    }
  };

  // ✅ Fetch ALL Retailers and show immediately
  const fetchAllRetailers = async () => {
    setLoadingRetailers(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "https://conceptpromotions.in/api/admin/retailers",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error("Failed to fetch retailers", { theme: "dark" });
        return;
      }
      const retailers = data.retailers || [];
      setAllRetailers(retailers);
      applyFilters(retailers);
      toast.success(`Loaded ${retailers.length} retailers`, { theme: "dark" });
    } catch (err) {
      console.log("Retailer Fetch Error:", err);
      toast.error("Error loading retailers", { theme: "dark" });
    } finally {
      setLoadingRetailers(false);
    }
  };

  // ✅ Fetch ALL Employees 
  const fetchAllEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        "https://conceptpromotions.in/api/admin/employees",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();

      if (!res.ok) {
        toast.error("Failed to fetch employees", { theme: "dark" });
        return;
      }

      const employees = data.employees || [];
      setAllEmployees(employees);
      applyEmployeeFilters(employees);
      toast.success(`Loaded ${employees.length} employees`, { theme: "dark" });

    } catch (err) {
      toast.error("Error loading employees", { theme: "dark" });
    } finally {
      setLoadingEmployees(false);
    }
  };

  // ✅ Apply filters to retailers
  const applyFilters = (retailersList = allRetailers) => {
    let filtered = [...retailersList];

    if (selectedCampaign?.data?.states) {
      const allowedStates = selectedCampaign.data.states;
      if (!allowedStates.includes("All") && !allowedStates.includes("All States")) {
        filtered = filtered.filter((r) =>
          allowedStates.includes(r?.shopDetails?.shopAddress?.state)
        );
      }
    }

    if (state) {
      filtered = filtered.filter(
        (r) => r.shopDetails?.shopAddress?.state === state.value
      );
    }

    if (businessType) {
      filtered = filtered.filter(
        (r) => r.shopDetails?.businessType === businessType.value
      );
    }

    // 🔍 Dynamic Search Filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((r) =>
        r.uniqueId?.toLowerCase().includes(query) ||
        r.shopDetails?.shopName?.toLowerCase().includes(query) ||
        r.name?.toLowerCase().includes(query)
      );
    }

    // ✅ Add assignment status to each retailer
    filtered = filtered.map((r) => {
      const assignedRetailer = selectedCampaign?.data?.assignedRetailers?.find(
        (ar) => ar.retailerId === r._id || ar.retailerId?._id === r._id
      );
      return {
        ...r,
        assignmentStatus: assignedRetailer ? assignedRetailer.status : "not_assigned"
      };
    });

    setTableData(filtered);

    if (filtered.length === 0) {
      toast.info("No retailers match your search/filter.", { theme: "dark" });
    }
  };

  // ✅ Apply filters to employees
  const applyEmployeeFilters = (employeesList = allEmployees) => {
    let filtered = [...employeesList];

    if (employeeState) {
      filtered = filtered.filter(
        (e) => e.correspondenceAddress?.state === employeeState.value
      );
    }

    if (employeeSearchQuery.trim() !== "") {
      const query = employeeSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.employeeId?.toLowerCase().includes(query) ||
          e.name?.toLowerCase().includes(query) ||
          e.email?.toLowerCase().includes(query)
      );
    }

    // ✅ Add assignment status to each employee
    filtered = filtered.map((e) => {
      const assignedEmployee = selectedCampaign?.data?.assignedEmployees?.find(
        (ae) => ae.employeeId === e._id || ae.employeeId?._id === e._id
      );
      return {
        ...e,
        assignmentStatus: assignedEmployee ? assignedEmployee.status : "not_assigned"
      };
    });

    setEmployeeTableData(filtered);

    if (filtered.length === 0) {
      toast.info("No employees match search/filter.", { theme: "dark" });
    }
  };

  useEffect(() => {
    if (assignType === "individual" && assignTarget === "retailer" && allRetailers.length === 0) {
      fetchAllRetailers();
    } else if (assignType === "individual" && assignTarget === "retailer" && allRetailers.length > 0) {
      applyFilters();
    }
  }, [assignType, assignTarget]);

  useEffect(() => {
    if (allRetailers.length > 0 && assignTarget === "retailer") {
      applyFilters();
    }
  }, [state, businessType, futureField]);

  // Auto-remove selected retailers that disappear from table after filtering
  useEffect(() => {
    setSelectedRetailers((prev) =>
      prev.filter((id) => tableData.some((r) => r._id === id))
    );
  }, [tableData]);

  useEffect(() => {
    if (allRetailers.length > 0 && assignTarget === "retailer") {
      applyFilters();
    }
  }, [searchQuery]);

  useEffect(() => {
    if (assignType === "individual" && assignTarget === "employee" && allEmployees.length === 0) {
      fetchAllEmployees();
    } else if (assignTarget === "employee" && allEmployees.length > 0) {
      applyEmployeeFilters();
    }
  }, [assignType, assignTarget]);

  useEffect(() => {
    if (assignTarget === "employee" && allEmployees.length > 0) {
      applyEmployeeFilters();
    }
  }, [employeeState, employeeFutureField1, employeeFutureField2, employeeSearchQuery]);

  // Auto-remove selected employees that disappear from table after filtering
  useEffect(() => {
    setSelectedEmployees((prev) =>
      prev.filter((id) => employeeTableData.some((e) => e._id === id))
    );
  }, [employeeTableData]);

  // ✅ Handle individual checkbox toggle
  // ✅ Handle individual checkbox toggle
  const handleCheckboxChange = (retailerId, assignmentStatus) => {
    // Check if already assigned
    if (assignmentStatus && assignmentStatus !== "not_assigned") {
      toast.warning(
        `This retailer is already ${assignmentStatus} for this campaign!`,
        { theme: "dark", autoClose: 3000 }
      );
      return;
    }

    setSelectedRetailers((prev) => {
      if (prev.includes(retailerId)) {
        return prev.filter((id) => id !== retailerId);
      } else {
        return [...prev, retailerId];
      }
    });
  };

  // ✅ Handle select all checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Only select retailers that are NOT already assigned
      const selectableIds = tableData
        .filter((r) => r.assignmentStatus === "not_assigned")
        .map((r) => r._id);

      if (selectableIds.length === 0) {
        toast.info("All displayed retailers are already assigned to this campaign", {
          theme: "dark"
        });
        return;
      }

      const alreadyAssignedCount = tableData.length - selectableIds.length;
      if (alreadyAssignedCount > 0) {
        toast.info(
          `${alreadyAssignedCount} retailer(s) skipped (already assigned)`,
          { theme: "dark" }
        );
      }

      setSelectedRetailers(selectableIds);
    } else {
      setSelectedRetailers([]);
    }
  };

  // ✅ Check if all visible retailers are selected
  // ✅ Check if all visible retailers are selected
  const selectableRetailers = tableData.filter((r) => r.assignmentStatus === "not_assigned");
  const isAllSelected = selectableRetailers.length > 0 &&
    selectedRetailers.length === selectableRetailers.length &&
    selectableRetailers.every((r) => selectedRetailers.includes(r._id));
  const isSomeSelected = selectedRetailers.length > 0 && !isAllSelected;

  // ✅ Handle employee checkbox toggle
  const handleEmployeeCheckboxChange = (employeeId, assignmentStatus) => {
    // Check if already assigned
    if (assignmentStatus && assignmentStatus !== "not_assigned") {
      toast.warning(
        `This employee is already ${assignmentStatus} for this campaign!`,
        { theme: "dark", autoClose: 3000 }
      );
      return;
    }

    setSelectedEmployees((prev) => {
      if (prev.includes(employeeId)) {
        return prev.filter((id) => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  // ✅ Handle employee select all
  const handleEmployeeSelectAll = (e) => {
    if (e.target.checked) {
      // Only select employees that are NOT already assigned
      const selectableIds = employeeTableData
        .filter((emp) => emp.assignmentStatus === "not_assigned")
        .map((emp) => emp._id);

      if (selectableIds.length === 0) {
        toast.info("All displayed employees are already assigned to this campaign", {
          theme: "dark"
        });
        return;
      }

      const alreadyAssignedCount = employeeTableData.length - selectableIds.length;
      if (alreadyAssignedCount > 0) {
        toast.info(
          `${alreadyAssignedCount} employee(s) skipped (already assigned)`,
          { theme: "dark" }
        );
      }

      setSelectedEmployees(selectableIds);
    } else {
      setSelectedEmployees([]);
    }
  };

  // ✅ Check if all visible employees are selected
  const selectableEmployees = employeeTableData.filter((e) => e.assignmentStatus === "not_assigned");
  const isAllEmployeesSelected = selectableEmployees.length > 0 &&
    selectedEmployees.length === selectableEmployees.length &&
    selectableEmployees.every((e) => selectedEmployees.includes(e._id));
  const isSomeEmployeesSelected = selectedEmployees.length > 0 && !isAllEmployeesSelected;

  const handleAssign = async () => {
    if (!selectedCampaign) {
      toast.error("Please select a campaign first", { theme: "dark" });
      return;
    }

    // Check based on assignTarget
    const targetCount = assignTarget === "retailer" ? selectedRetailers.length : selectedEmployees.length;
    const targetType = assignTarget === "retailer" ? "retailer(s)" : "employee(s)";

    if (targetCount === 0) {
      toast.error(`Please select at least one ${assignTarget}`, { theme: "dark" });
      return;
    }

    // Show confirmation
    const confirmMessage = `Are you sure you want to assign "${selectedCampaign.label}" to ${targetCount} ${targetType}?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setAssigning(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "https://conceptpromotions.in/api/admin/campaigns/assign",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            campaignId: selectedCampaign.value,
            retailerIds: assignTarget === "retailer" ? selectedRetailers : [],
            employeeIds: assignTarget === "employee" ? selectedEmployees : [],
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to assign campaign", {
          theme: "dark",
          autoClose: 5000,
        });
      } else {
        toast.success(
          data.message || `Campaign assigned to ${targetCount} ${targetType}! ✅`,
          {
            theme: "dark",
            autoClose: 4000,
          }
        );

        // Remove assigned items from lists
        if (assignTarget === "retailer") {
          setAllRetailers((prev) =>
            prev.filter((r) => !selectedRetailers.includes(r._id))
          );
          setTableData((prev) =>
            prev.filter((r) => !selectedRetailers.includes(r._id))
          );
          setSelectedRetailers([]);
        } else {
          setAllEmployees((prev) =>
            prev.filter((e) => !selectedEmployees.includes(e._id))
          );
          setEmployeeTableData((prev) =>
            prev.filter((e) => !selectedEmployees.includes(e._id))
          );
          setSelectedEmployees([]);
        }
      }
    } catch (error) {
      console.error("Assign error:", error);
      toast.error("Network error: Unable to reach server", {
        theme: "dark",
        autoClose: 5000,
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleCampaignChange = (selected) => {
    setSelectedCampaign(selected);
    setAssignType(null);
    setAssignTarget(null);
    setState(null);
    setBusinessType(null);
    setFutureField(null);
    setTableData([]);
    setSelectedRetailers([]);
    setAllRetailers([]);
    setEmployeeTableData([]);
    setSelectedEmployees([]);
    setAllEmployees([]);
    setEmployeeState(null);
    setEmployeeSearchQuery("");
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="min-h-screen bg-[#171717] p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-[#E4002B] mb-8">
            Assign Campaign
          </h1>

          <div className="bg-[#EDEDED] rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-700">
              Select Campaign *
            </h2>
            <Select
              value={selectedCampaign}
              onChange={handleCampaignChange}
              options={campaigns}
              isLoading={loadingCampaigns}
              styles={customSelectStyles}
              placeholder="Choose a campaign"
              isSearchable
              className="max-w-md"
            />
            {selectedCampaign && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
                <p>
                  <strong>Client:</strong> {selectedCampaign.data.client}
                </p>
                <p>
                  <strong>Type:</strong> {selectedCampaign.data.type}
                </p>
                <p>
                  <strong>Region(s):</strong>{" "}
                  {Array.isArray(selectedCampaign.data.regions)
                    ? selectedCampaign.data.regions.join(", ")
                    : selectedCampaign.data.region || "N/A"}
                </p>
                <p>
                  <strong>State(s):</strong>{" "}
                  {Array.isArray(selectedCampaign.data.states)
                    ? selectedCampaign.data.states.join(", ")
                    : selectedCampaign.data.state || "N/A"}
                </p>
              </div>
            )}
          </div>

          {selectedCampaign && (
            <div className="bg-[#EDEDED] rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">
                Assignment Type *
              </h2>
              <Select
                value={
                  assignType
                    ? { label: assignType === "individual" ? "Individual Assign" : "Bulk Assign", value: assignType }
                    : null
                }
                onChange={(e) => {
                  setAssignType(e.value);
                  setAssignTarget(null);
                  setState(null);
                  setBusinessType(null);
                  setFutureField(null);
                  setTableData([]);
                  setSelectedRetailers([]);
                  setEmployeeState(null);
                  setEmployeeFutureField1(null);
                  setEmployeeFutureField2(null);
                  setEmployeeSearchQuery("");
                  setEmployeeTableData([]);
                  setSelectedEmployees([]);
                }}
                options={[
                  { label: "Individual Assign", value: "individual" },
                  { label: "Bulk Assign", value: "bulk" },
                ]}
                styles={customSelectStyles}
                className="mb-6 max-w-md"
                placeholder="Select assignment type"
              />

              {assignType && (
                <>
                  <h2 className="text-lg font-semibold mb-4 text-gray-700">
                    Assign To *
                  </h2>
                  <Select
                    value={
                      assignTarget
                        ? { label: assignTarget === "retailer" ? "Retailer" : "Employee", value: assignTarget }
                        : null
                    }
                    onChange={(e) => {
                      setAssignTarget(e.value);
                      setState(null);
                      setBusinessType(null);
                      setFutureField(null);
                      setTableData([]);
                      setSelectedRetailers([]);
                      setEmployeeState(null);
                      setEmployeeFutureField1(null);
                      setEmployeeFutureField2(null);
                      setEmployeeSearchQuery("");
                      setEmployeeTableData([]);
                      setSelectedEmployees([]);
                    }}
                    options={[
                      { label: "Retailer", value: "retailer" },
                      { label: "Employee", value: "employee" },
                    ]}
                    styles={customSelectStyles}
                    className="mb-6 max-w-md"
                    placeholder="Select target"
                  />
                </>
              )}

              {assignType === "individual" && assignTarget === "retailer" && (
                <>
                  <h2 className="text-lg font-semibold mb-4 text-gray-700">
                    Filter Retailers {loadingRetailers ? "(Loading...)" : ""}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <Select
                        value={state}
                        onChange={setState}
                        options={[...new Set(allRetailers.map((r) => r?.shopDetails?.shopAddress?.state))]
                          .filter(Boolean)
                          .map((state) => ({
                            label: state,
                            value: state,
                          }))
                        }
                        styles={customSelectStyles}
                        placeholder="Select state"
                        isSearchable
                        isClearable
                        isDisabled={loadingRetailers}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Type
                      </label>
                      <Select
                        value={businessType}
                        onChange={setBusinessType}
                        options={BUSINESS_TYPES.map((b) => ({
                          label: b,
                          value: b,
                        }))}
                        styles={customSelectStyles}
                        placeholder="Select business type"
                        isSearchable
                        isClearable
                        isDisabled={loadingRetailers}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Future Filter
                      </label>
                      <Select
                        value={futureField}
                        onChange={setFutureField}
                        options={[]}
                        styles={customSelectStyles}
                        placeholder="Coming soon"
                        isDisabled
                      />
                    </div>
                  </div>

                  {/* 🔍 Search Bar Inside Filters */}
                  <div className="flex items-center justify-between mb-6 gap-4">
                    <input
                      type="text"
                      placeholder="Search by Unique Code / Outlet Name / Retailer Name"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full md:w-96 px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />

                    {(searchQuery || state || businessType) && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setState(null);
                          setBusinessType(null);
                        }}
                        className="text-sm text-red-600 underline hover:text-red-800"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </>
              )}
              {assignType === "individual" && assignTarget === "employee" && (
                <>
                  <h2 className="text-lg font-semibold mb-4 text-gray-700">
                    Filter Employees {loadingEmployees ? "(Loading...)" : ""}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <Select
                        value={employeeState}
                        onChange={setEmployeeState}
                        options={[...new Set(allEmployees.map((e) => e?.correspondenceAddress?.state))]
                          .filter(Boolean)
                          .map((s) => ({ label: s, value: s }))}
                        styles={customSelectStyles}
                        placeholder="Select state"
                        isSearchable
                        isClearable
                        isDisabled={loadingEmployees}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Future Filter 1
                      </label>
                      <Select
                        value={employeeFutureField1}
                        onChange={setEmployeeFutureField1}
                        options={[]}
                        styles={customSelectStyles}
                        placeholder="Coming soon"
                        isDisabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Future Filter 2
                      </label>
                      <Select
                        value={employeeFutureField2}
                        onChange={setEmployeeFutureField2}
                        options={[]}
                        styles={customSelectStyles}
                        placeholder="Coming soon"
                        isDisabled
                      />
                    </div>
                  </div>

                  {/* 🔍 Search Bar */}
                  <div className="flex items-center justify-between mb-6 gap-4">
                    <input
                      type="text"
                      placeholder="Search by Employee ID / Name / Email"
                      value={employeeSearchQuery}
                      onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                      className="w-full md:w-96 px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />

                    {(employeeSearchQuery || employeeState) && (
                      <button
                        onClick={() => {
                          setEmployeeSearchQuery("");
                          setEmployeeState(null);
                          setEmployeeFutureField1(null);
                          setEmployeeFutureField2(null);
                        }}
                        className="text-sm text-red-600 underline hover:text-red-800"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </>
              )}

              {(loadingRetailers || tableData.length > 0) &&
                assignTarget === "retailer" && (
                  <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-700">
                        {loadingRetailers
                          ? "Loading Retailers..."
                          : `Select Retailers (${tableData.length} found, ${selectedRetailers.length} selected)`}
                      </h2>
                    </div>

                    {loadingRetailers ? (
                      <div className="text-center py-8 text-gray-500">
                        Fetching retailers...
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      onChange={handleSelectAll}
                                      checked={isAllSelected}
                                      ref={(input) => input && (input.indeterminate = isSomeSelected)}
                                      className="w-4 h-4 cursor-pointer"
                                    />
                                    All
                                  </label>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unique Code</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outlet Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retailer Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  Status
                                </th>
                              </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-gray-200">
                              {tableData.map((r, index) => {
                                const isAlreadyAssigned = r.assignmentStatus !== "not_assigned";
                                return (
                                  <tr
                                    key={r._id}
                                    className={`hover:bg-gray-50 ${selectedRetailers.includes(r._id)
                                      ? "bg-red-50"
                                      : isAlreadyAssigned
                                        ? "bg-gray-100 opacity-60"
                                        : ""
                                      }`}
                                  >
                                    <td className="px-4 py-3">
                                      <input
                                        type="checkbox"
                                        checked={selectedRetailers.includes(r._id)}
                                        onChange={() => handleCheckboxChange(r._id, r.assignmentStatus)}
                                        disabled={isAlreadyAssigned}
                                        className={`w-4 h-4 ${isAlreadyAssigned ? "cursor-not-allowed" : "cursor-pointer"
                                          }`}
                                      />
                                    </td>

                                    <td className="px-4 py-3 text-sm">{index + 1}</td>

                                    <td className="px-4 py-3 text-sm font-medium text-gray-700">
                                      {r.uniqueId || "-"}
                                    </td>

                                    <td className="px-4 py-3 text-sm font-medium text-gray-700">
                                      {r.shopDetails?.shopName || "-"}
                                    </td>

                                    <td className="px-4 py-3 text-sm text-gray-700">
                                      {r.name || "-"}
                                    </td>

                                    <td className="px-4 py-3 text-sm text-gray-600">
                                      {r.shopDetails?.businessType || "-"}
                                    </td>

                                    <td className="px-4 py-3 text-sm text-gray-600">
                                      {r.shopDetails?.shopAddress?.state || "-"}
                                    </td>

                                    <td className="px-4 py-3 text-sm">
                                      {r.assignmentStatus === "not_assigned" ? (
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                          Available
                                        </span>
                                      ) : (
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${r.assignmentStatus === "pending"
                                          ? "bg-yellow-100 text-yellow-700"
                                          : r.assignmentStatus === "accepted"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-red-100 text-red-700"
                                          }`}>
                                          {r.assignmentStatus.charAt(0).toUpperCase() + r.assignmentStatus.slice(1)}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <button
                          onClick={handleAssign}
                          disabled={assigning || selectedRetailers.length === 0}
                          className={`mt-6 w-full py-3 rounded-lg font-semibold text-white transition ${assigning || selectedRetailers.length === 0
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700"
                            }`}
                        >
                          {assigning
                            ? "Assigning..."
                            : `Assign Campaign to ${selectedRetailers.length} Retailer(s)`}
                        </button>
                      </>
                    )}
                  </div>
                )}
              {(loadingEmployees || employeeTableData.length > 0) &&
                assignTarget === "employee" && assignType === "individual" && (
                  <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-700">
                        {loadingEmployees
                          ? "Loading Employees..."
                          : `Select Employees (${employeeTableData.length} found, ${selectedEmployees.length} selected)`}
                      </h2>
                    </div>

                    {loadingEmployees ? (
                      <div className="text-center py-8 text-gray-500">
                        Fetching employees...
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      onChange={handleEmployeeSelectAll}
                                      checked={isAllEmployeesSelected}
                                      ref={(input) => input && (input.indeterminate = isSomeEmployeesSelected)}
                                      className="w-4 h-4 cursor-pointer"
                                    />
                                    All
                                  </label>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                              </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-gray-200">
                              {employeeTableData.map((e, index) => {
                                const isAlreadyAssigned = e.assignmentStatus !== "not_assigned";
                                return (
                                  <tr
                                    key={e._id}
                                    className={`hover:bg-gray-50 ${selectedEmployees.includes(e._id)
                                      ? "bg-red-50"
                                      : isAlreadyAssigned
                                        ? "bg-gray-100 opacity-60"
                                        : ""
                                      }`}
                                  >
                                    <td className="px-4 py-3">
                                      <input
                                        type="checkbox"
                                        checked={selectedEmployees.includes(e._id)}
                                        onChange={() => handleEmployeeCheckboxChange(e._id, e.assignmentStatus)}
                                        disabled={isAlreadyAssigned}
                                        className={`w-4 h-4 ${isAlreadyAssigned ? "cursor-not-allowed" : "cursor-pointer"
                                          }`}
                                      />
                                    </td>

                                    <td className="px-4 py-3 text-sm">{index + 1}</td>

                                    <td className="px-4 py-3 text-sm font-medium text-gray-700">
                                      {e.employeeId || "-"}
                                    </td>

                                    <td className="px-4 py-3 text-sm text-gray-700">
                                      {e.name || "-"}
                                    </td>

                                    <td className="px-4 py-3 text-sm text-gray-600">
                                      {e.email || "-"}
                                    </td>

                                    <td className="px-4 py-3 text-sm text-gray-600">
                                      {e.phone || "-"}
                                    </td>

                                    <td className="px-4 py-3 text-sm text-gray-600">
                                      {e.correspondenceAddress?.state || "-"}
                                    </td>

                                    <td className="px-4 py-3 text-sm">
                                      {e.assignmentStatus === "not_assigned" ? (
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                          Available
                                        </span>
                                      ) : (
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${e.assignmentStatus === "pending"
                                          ? "bg-yellow-100 text-yellow-700"
                                          : e.assignmentStatus === "accepted"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-red-100 text-red-700"
                                          }`}>
                                          {e.assignmentStatus.charAt(0).toUpperCase() + e.assignmentStatus.slice(1)}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <button
                          onClick={handleAssign}
                          disabled={assigning || selectedEmployees.length === 0}
                          className={`mt-6 w-full py-3 rounded-lg font-semibold text-white transition ${assigning || selectedEmployees.length === 0
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700"
                            }`}
                        >
                          {assigning
                            ? "Assigning..."
                            : `Assign Campaign to ${selectedEmployees.length} Employee(s)`}
                        </button>
                      </>
                    )}
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AssignCampaign;
