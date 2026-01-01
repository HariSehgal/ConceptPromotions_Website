import React, { useState, useEffect } from "react";
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
    menu: (provided) => ({
        ...provided,
        zIndex: 20,
    }),
};

const ManageInstallments = () => {
    // All Data from APIs
    const [allCampaigns, setAllCampaigns] = useState([]);
    const [allRetailers, setAllRetailers] = useState([]);
    const [allStates, setAllStates] = useState([]);

    // Selected Filters
    const [selectedState, setSelectedState] = useState(null);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [selectedRetailer, setSelectedRetailer] = useState(null);

    // Filtered Options for Dropdowns
    const [stateOptions, setStateOptions] = useState([]);
    const [campaignOptions, setCampaignOptions] = useState([]);
    const [retailerOptions, setRetailerOptions] = useState([]);

    const [loading, setLoading] = useState(true);

    // Budget & Installments Data
    const [budgetData, setBudgetData] = useState(null);
    const [campaignBudget, setCampaignBudget] = useState(null);
    const [installments, setInstallments] = useState([]);

    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingInstallment, setEditingInstallment] = useState(null);

    // Form Data - ✅ Removed installmentNo from form
    const [formData, setFormData] = useState({
        installmentAmount: "",
        dateOfInstallment: "",
        utrNumber: "",
        remarks: "",
    });

    // ===============================
    // FETCH ALL DATA ON MOUNT
    // ===============================
    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");

            // Fetch Campaigns
            const campaignsRes = await fetch(
                "https://conceptpromotions.in/api/admin/campaigns",
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const campaignsData = await campaignsRes.json();
            const campaigns = (campaignsData.campaigns || []).filter(
                (c) => c.isActive === true
            );

            // Fetch Retailers
            const retailersRes = await fetch(
                "https://conceptpromotions.in/api/admin/retailers",
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const retailersData = await retailersRes.json();
            const retailers = retailersData.retailers || [];

            setAllCampaigns(campaigns);
            setAllRetailers(retailers);

            // Extract all unique states from retailers
            const uniqueStates = [
                ...new Set(
                    retailers
                        .map((r) => r.shopDetails?.shopAddress?.state)
                        .filter(Boolean)
                ),
            ];
            setAllStates(uniqueStates);

            // Initialize dropdown options
            setStateOptions(uniqueStates.map((s) => ({ label: s, value: s })));
            setCampaignOptions(
                campaigns.map((c) => ({ label: c.name, value: c._id, data: c }))
            );
            setRetailerOptions(
                retailers.map((r) => ({
                    label: `${r.uniqueId} - ${r.shopDetails?.shopName || "N/A"}`,
                    value: r._id,
                    data: r,
                }))
            );
        } catch (err) {
            console.error("Error fetching data:", err);
            toast.error("Failed to load data", { theme: "dark" });
        } finally {
            setLoading(false);
        }
    };

    // ===============================
    // FETCH BUDGET WHEN RETAILER + CAMPAIGN SELECTED
    // ===============================
    useEffect(() => {
        if (selectedRetailer && selectedCampaign) {
            fetchBudgetData();
        } else {
            resetBudgetData();
        }
    }, [selectedRetailer, selectedCampaign]);

    const fetchBudgetData = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `https://conceptpromotions.in/api/budgets/retailer/${selectedRetailer.value}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.budget) {
                    setBudgetData(data.budget);

                    const campaign = data.budget.campaigns.find(
                        (c) =>
                            c.campaignId._id.toString() ===
                            selectedCampaign.value.toString()
                    );

                    if (campaign) {
                        setCampaignBudget(campaign);
                        setInstallments(campaign.installments || []);
                    } else {
                        toast.error("No budget found for this campaign", { theme: "dark" });
                        resetBudgetData();
                    }
                } else {
                    toast.error("No budget found for this retailer", { theme: "dark" });
                    resetBudgetData();
                }
            } else {
                toast.error("Failed to fetch budget data", { theme: "dark" });
                resetBudgetData();
            }
        } catch (error) {
            console.error("Error fetching budget:", error);
            toast.error("Failed to fetch budget data", { theme: "dark" });
            resetBudgetData();
        }
    };

    const resetBudgetData = () => {
        setBudgetData(null);
        setCampaignBudget(null);
        setInstallments([]);
    };

    // ===============================
    // FILTER LOGIC
    // ===============================
    useEffect(() => {
        if (!selectedState && !selectedCampaign && !selectedRetailer) {
            setStateOptions(allStates.map((s) => ({ label: s, value: s })));
            setCampaignOptions(
                allCampaigns.map((c) => ({ label: c.name, value: c._id, data: c }))
            );
            setRetailerOptions(
                allRetailers.map((r) => ({
                    label: `${r.uniqueId} - ${r.shopDetails?.shopName || "N/A"}`,
                    value: r._id,
                    data: r,
                }))
            );
            return;
        }

        applyFilters();
    }, [selectedState, selectedCampaign, selectedRetailer]);

    const applyFilters = () => {
        let filteredRetailers = [...allRetailers];
        let filteredCampaigns = [...allCampaigns];
        let filteredStates = [...allStates];

        if (selectedState) {
            filteredRetailers = filteredRetailers.filter(
                (r) => r.shopDetails?.shopAddress?.state === selectedState.value
            );

            filteredCampaigns = filteredCampaigns.filter((c) => {
                if (Array.isArray(c.states)) {
                    return c.states.includes(selectedState.value);
                }
                return c.state === selectedState.value;
            });
        }

        if (selectedCampaign) {
            const campaignData = allCampaigns.find(
                (c) => c._id === selectedCampaign.value
            );

            if (campaignData) {
                const campaignStates = Array.isArray(campaignData.states)
                    ? campaignData.states
                    : campaignData.state
                        ? [campaignData.state]
                        : [];

                if (!selectedState) {
                    filteredStates = filteredStates.filter((s) =>
                        campaignStates.includes(s)
                    );
                }

                filteredRetailers = filteredRetailers.filter((r) => {
                    const inCampaignState = campaignStates.includes(
                        r.shopDetails?.shopAddress?.state
                    );
                    const assignedToCampaign =
                        Array.isArray(r.assignedCampaigns) &&
                        r.assignedCampaigns.some(
                            (ac) =>
                                (typeof ac === "string" ? ac : ac._id) ===
                                selectedCampaign.value
                        );
                    return inCampaignState && assignedToCampaign;
                });
            }
        }

        if (selectedRetailer) {
            const retailerData = allRetailers.find(
                (r) => r._id === selectedRetailer.value
            );

            if (retailerData) {
                const retailerState = retailerData.shopDetails?.shopAddress?.state;

                if (!selectedState && retailerState) {
                    filteredStates = [retailerState];
                }

                if (!selectedCampaign) {
                    const retailerCampaignIds = (
                        retailerData.assignedCampaigns || []
                    ).map((ac) => (typeof ac === "string" ? ac : ac._id));

                    filteredCampaigns = filteredCampaigns.filter((c) =>
                        retailerCampaignIds.includes(c._id)
                    );
                }
            }
        }

        setStateOptions(filteredStates.map((s) => ({ label: s, value: s })));
        setCampaignOptions(
            filteredCampaigns.map((c) => ({
                label: c.name,
                value: c._id,
                data: c,
            }))
        );
        setRetailerOptions(
            filteredRetailers.map((r) => ({
                label: `${r.uniqueId} - ${r.shopDetails?.shopName || "N/A"}`,
                value: r._id,
                data: r,
            }))
        );
    };

    // ===============================
    // HANDLE FILTER CHANGES
    // ===============================
    const handleStateChange = (selected) => {
        setSelectedState(selected);
        if (!selected) {
            setSelectedCampaign(null);
            setSelectedRetailer(null);
        }
    };

    const handleCampaignChange = (selected) => {
        setSelectedCampaign(selected);
        if (!selected) {
            setSelectedRetailer(null);
        }
    };

    const handleRetailerChange = (selected) => {
        setSelectedRetailer(selected);

        // ✅ Auto-select state when retailer is selected
        if (selected && selected.data) {
            const retailerState = selected.data.shopDetails?.shopAddress?.state;
            if (retailerState) {
                // Find and set the state option
                const stateOption = stateOptions.find(s => s.value === retailerState);
                if (stateOption) {
                    setSelectedState(stateOption);
                }
            }
        } else {
            // ✅ Clear state when retailer is cleared
            setSelectedState(null);
        }
    };

    const handleClearAllFilters = () => {
        setSelectedState(null);
        setSelectedCampaign(null);
        setSelectedRetailer(null);
        resetBudgetData();
    };

    // ===============================
    // ✅ AUTO-GENERATE INSTALLMENT NUMBER
    // ===============================
    const getNextInstallmentNumber = () => {
        if (!installments || installments.length === 0) return 1;
        const maxNo = Math.max(...installments.map(inst => inst.installmentNo || 0));
        return maxNo + 1;
    };

    // ===============================
    // ✅ VALIDATE INSTALLMENT AMOUNT
    // ===============================
    const validateInstallmentAmount = (amount, isEdit = false, editingInstallmentAmount = 0) => {
        const numAmount = parseFloat(amount);

        if (isNaN(numAmount) || numAmount <= 0) {
            toast.error("Please enter a valid amount", { theme: "dark" });
            return false;
        }

        // Get current pending balance
        const currentPending = campaignBudget?.cPending || 0;

        // For edit: add back the original installment amount to get actual remaining
        const availableBalance = isEdit
            ? currentPending + editingInstallmentAmount
            : currentPending;

        if (numAmount > availableBalance) {
            toast.error(
                `Installment amount (₹${numAmount}) exceeds available balance (₹${availableBalance}). Please enter a lower amount.`,
                {
                    theme: "dark",
                    autoClose: 5000
                }
            );
            return false;
        }

        return true;
    };

    // ===============================
    // ADD INSTALLMENT
    // ===============================
    const handleAddInstallment = async () => {
        if (!formData.installmentAmount || !formData.utrNumber || !formData.dateOfInstallment) {
            toast.error("Please fill all required fields", { theme: "dark" });
            return;
        }

        // ✅ Validate amount doesn't exceed balance
        if (!validateInstallmentAmount(formData.installmentAmount)) {
            return;
        }

        try {
            const token = localStorage.getItem("token");

            // ✅ Auto-generate installment number
            const installmentNo = getNextInstallmentNumber();

            const payload = {
                retailerId: selectedRetailer.value,
                retailerName: selectedRetailer.data.shopDetails?.shopName || "",
                state: selectedRetailer.data.shopDetails?.shopAddress?.state || "",
                shopName: selectedRetailer.data.shopDetails?.shopName || "",
                outletCode: selectedRetailer.data.uniqueId,
                campaignId: selectedCampaign.value,
                campaignName: selectedCampaign.data.name,
                tca: campaignBudget?.tca || 0,
                installment: {
                    installmentNo: installmentNo,
                    installmentAmount: parseFloat(formData.installmentAmount),
                    dateOfInstallment: formData.dateOfInstallment,
                    utrNumber: formData.utrNumber,
                    remarks: formData.remarks,
                },
            };

            const response = await fetch(
                "https://conceptpromotions.in/api/budgets/add-payment",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success("Installment added successfully!", { theme: "dark" });
                setShowAddModal(false);
                resetForm();
                await fetchBudgetData();
            } else {
                toast.error(data.message || "Failed to add installment", {
                    theme: "dark",
                });
            }
        } catch (error) {
            console.error("Error adding installment:", error);
            toast.error("Failed to add installment", { theme: "dark" });
        }
    };

    // ===============================
    // EDIT INSTALLMENT
    // ===============================
    const handleEditInstallment = async () => {
        if (!formData.installmentAmount || !formData.utrNumber || !formData.dateOfInstallment) {
            toast.error("Please fill all required fields", { theme: "dark" });
            return;
        }

        // ✅ Validate amount doesn't exceed balance (considering original amount)
        if (!validateInstallmentAmount(
            formData.installmentAmount,
            true,
            editingInstallment?.installmentAmount || 0
        )) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const payload = {
                installmentNo: editingInstallment.installmentNo, // Keep original number
                installmentAmount: parseFloat(formData.installmentAmount),
                dateOfInstallment: formData.dateOfInstallment,
                utrNumber: formData.utrNumber,
                remarks: formData.remarks,
            };

            const response = await fetch(
                `https://conceptpromotions.in/api/budgets/${budgetData._id}/campaign/${campaignBudget._id}/installment/${editingInstallment._id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success("Installment updated successfully!", { theme: "dark" });
                setShowEditModal(false);
                resetForm();
                await fetchBudgetData();
            } else {
                toast.error(data.message || "Failed to update installment", {
                    theme: "dark",
                });
            }
        } catch (error) {
            console.error("Error updating installment:", error);
            toast.error("Failed to update installment", { theme: "dark" });
        }
    };

    // ===============================
    // DELETE INSTALLMENT
    // ===============================
    const handleDeleteInstallment = async (installment) => {
        if (!window.confirm("Are you sure you want to delete this installment?")) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `https://conceptpromotions.in/api/budgets/${budgetData._id}/campaign/${campaignBudget._id}/installment/${installment._id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success("Installment deleted successfully!", { theme: "dark" });
                await fetchBudgetData();
            } else {
                toast.error(data.message || "Failed to delete installment", {
                    theme: "dark",
                });
            }
        } catch (error) {
            console.error("Error deleting installment:", error);
            toast.error("Failed to delete installment", { theme: "dark" });
        }
    };

    // ===============================
    // HELPER FUNCTIONS
    // ===============================
    const resetForm = () => {
        setFormData({
            installmentAmount: "",
            dateOfInstallment: "",
            utrNumber: "",
            remarks: "",
        });
        setEditingInstallment(null);
    };

    const openAddModal = () => {
        resetForm();
        setShowAddModal(true);
    };

    const openEditModal = (installment) => {
        setEditingInstallment(installment);
        setFormData({
            installmentAmount: installment.installmentAmount || "",
            dateOfInstallment: installment.dateOfInstallment?.split("T")[0] || "",
            utrNumber: installment.utrNumber || "",
            remarks: installment.remarks || "",
        });
        setShowEditModal(true);
    };

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="min-h-screen bg-[#171717] p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-[#E4002B] mb-8">
                        Manage Installments
                    </h1>

                    {loading ? (
                        <div className="bg-[#EDEDED] rounded-lg shadow-md p-6">
                            <p className="text-gray-600">Loading data...</p>
                        </div>
                    ) : (
                        <>
                            {/* Interlinked Filters */}
                            <div className="bg-[#EDEDED] rounded-lg shadow-md p-6 mb-6">
                                <h2 className="text-lg font-semibold mb-4 text-gray-700">
                                    Filter Options
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            State
                                        </label>
                                        <Select
                                            value={selectedState}
                                            onChange={handleStateChange}
                                            options={stateOptions}
                                            styles={customSelectStyles}
                                            placeholder="Select State"
                                            isClearable
                                            isSearchable
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Campaign
                                        </label>
                                        <Select
                                            value={selectedCampaign}
                                            onChange={handleCampaignChange}
                                            options={campaignOptions}
                                            styles={customSelectStyles}
                                            placeholder="Select Campaign"
                                            isClearable
                                            isSearchable
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Retailer
                                        </label>
                                        <Select
                                            value={selectedRetailer}
                                            onChange={handleRetailerChange}
                                            options={retailerOptions}
                                            styles={customSelectStyles}
                                            placeholder="Select Retailer"
                                            isClearable
                                            isSearchable
                                        />
                                    </div>
                                </div>

                                {(selectedState || selectedCampaign || selectedRetailer) && (
                                    <button
                                        onClick={handleClearAllFilters}
                                        className="mt-4 text-sm text-red-600 underline hover:text-red-800"
                                    >
                                        Clear All Filters
                                    </button>
                                )}
                            </div>

                            {/* Budget Summary */}
                            {campaignBudget && (
                                <div className="bg-[#EDEDED] rounded-lg shadow-md p-6 mb-6">
                                    <h2 className="text-lg font-semibold mb-3 text-gray-700">
                                        Budget Summary
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-600">Total Campaign Budget</p>
                                            <p className="text-2xl font-bold text-blue-600">
                                                ₹{campaignBudget.tca || 0}
                                            </p>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-600">Total Paid Amount</p>
                                            <p className="text-2xl font-bold text-green-600">
                                                ₹{campaignBudget.cPaid || 0}
                                            </p>
                                        </div>
                                        <div className={`${(campaignBudget.cPending || 0) < 0 ? 'bg-red-50' : 'bg-yellow-50'} p-4 rounded-lg`}>
                                            <p className="text-sm text-gray-600">Pending Amount</p>
                                            <p className={`text-2xl font-bold ${(campaignBudget.cPending || 0) < 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                                                ₹{campaignBudget.cPending || 0}
                                            </p>
                                        </div>
                                        <div className="bg-purple-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-600">Installments</p>
                                            <p className="text-2xl font-bold text-purple-600">
                                                {installments.length}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Installments Table */}
                            {campaignBudget && (
                                <div className="bg-[#EDEDED] rounded-lg shadow-md p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-semibold text-gray-700">
                                            Installments
                                        </h2>
                                        <button
                                            onClick={openAddModal}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                        >
                                            Add Installment
                                        </button>
                                    </div>

                                    {installments.length === 0 ? (
                                        <p className="text-gray-500 py-4">No installments added yet.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                                            #
                                                        </th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                                            Amount
                                                        </th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                                            Date
                                                        </th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                                            UTR Number
                                                        </th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                                            Remarks
                                                        </th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {installments.map((inst) => (
                                                        <tr key={inst._id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-2 text-sm">
                                                                {inst.installmentNo}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm font-semibold text-gray-700">
                                                                ₹{inst.installmentAmount}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm text-gray-600">
                                                                {new Date(inst.dateOfInstallment).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm text-gray-600">
                                                                {inst.utrNumber}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm text-gray-600">
                                                                {inst.remarks || "-"}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm">
                                                                <button
                                                                    onClick={() => openEditModal(inst)}
                                                                    className="text-blue-600 hover:text-blue-800 mr-3"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteInstallment(inst)}
                                                                    className="text-red-600 hover:text-red-800"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!campaignBudget && selectedRetailer && selectedCampaign && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                                    <p className="font-semibold">No Budget Found</p>
                                    <p>Please set a budget for this campaign and retailer first.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ✅ Add Installment Modal - REMOVED Installment Number Input */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Add Installment</h3>

                        {/* ✅ Show next installment number info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-blue-800">
                                <span className="font-semibold">Next Installment #:</span> {getNextInstallmentNumber()}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                                Available Balance: ₹{campaignBudget?.cPending || 0}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount * <span className="text-xs text-gray-500">(Max: ₹{campaignBudget?.cPending || 0})</span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.installmentAmount}
                                    onChange={(e) =>
                                        setFormData({ ...formData, installmentAmount: e.target.value })
                                    }
                                    placeholder="Enter amount"
                                    max={campaignBudget?.cPending || 0}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date *
                                </label>
                                <input
                                    type="date"
                                    value={formData.dateOfInstallment}
                                    onChange={(e) =>
                                        setFormData({ ...formData, dateOfInstallment: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    UTR Number *
                                </label>
                                <input
                                    type="text"
                                    value={formData.utrNumber}
                                    onChange={(e) =>
                                        setFormData({ ...formData, utrNumber: e.target.value })
                                    }
                                    placeholder="Enter UTR number"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Remarks
                                </label>
                                <textarea
                                    value={formData.remarks}
                                    onChange={(e) =>
                                        setFormData({ ...formData, remarks: e.target.value })
                                    }
                                    placeholder="Optional remarks"
                                    rows="3"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleAddInstallment}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            >
                                Add Installment
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    resetForm();
                                }}
                                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ Edit Installment Modal - Shows installment number as read-only */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Edit Installment</h3>

                        {/* Show installment number (read-only) */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-gray-700">
                                <span className="font-semibold">Installment #:</span> {editingInstallment?.installmentNo}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                                Available Balance: ₹{(campaignBudget?.cPending || 0) + (editingInstallment?.installmentAmount || 0)}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount * <span className="text-xs text-gray-500">(Max: ₹{(campaignBudget?.cPending || 0) + (editingInstallment?.installmentAmount || 0)})</span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.installmentAmount}
                                    onChange={(e) =>
                                        setFormData({ ...formData, installmentAmount: e.target.value })
                                    }
                                    max={(campaignBudget?.cPending || 0) + (editingInstallment?.installmentAmount || 0)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date *
                                </label>
                                <input
                                    type="date"
                                    value={formData.dateOfInstallment}
                                    onChange={(e) =>
                                        setFormData({ ...formData, dateOfInstallment: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    UTR Number *
                                </label>
                                <input
                                    type="text"
                                    value={formData.utrNumber}
                                    onChange={(e) =>
                                        setFormData({ ...formData, utrNumber: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Remarks
                                </label>
                                <textarea
                                    value={formData.remarks}
                                    onChange={(e) =>
                                        setFormData({ ...formData, remarks: e.target.value })
                                    }
                                    rows="3"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-none"
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleEditInstallment}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Update Installment
                            </button>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    resetForm();
                                }}
                                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ManageInstallments;
