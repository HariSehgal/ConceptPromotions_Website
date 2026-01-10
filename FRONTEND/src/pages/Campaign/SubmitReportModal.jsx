import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";
import { FiPlus, FiX } from "react-icons/fi";
import { API_URL } from "../../url/base";

const customSelectStyles = {
    control: (provided, state) => ({
        ...provided,
        borderColor: state.isFocused ? "#E4002B" : "#d1d5db",
        boxShadow: state.isFocused ? "0 0 0 1px #E4002B" : "none",
        "&:hover": { borderColor: "#E4002B" },
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused ? "#FEE2E2" : "white",
        color: "#333",
        "&:active": { backgroundColor: "#FECACA" },
    }),
};

const stockTypeOptions = [
    { value: "Opening Stock", label: "Opening Stock" },
    { value: "Closing Stock", label: "Closing Stock" },
    { value: "Purchase Stock", label: "Purchase Stock" },
    { value: "Sold Stock", label: "Sold Stock" },
];

const productTypeOptions = [
    { value: "Focus", label: "Focus" },
    { value: "All", label: "All" },
];

const reportTypes = [
    { value: "Window Display", label: "Window Display" },
    { value: "Stock", label: "Stock" },
    { value: "Others", label: "Others" },
];

const SubmitReportModal = ({
    retailers,
    employees,
    onSubmit,
    onClose,
    campaignId,
}) => {
    // Prevent background scrolling
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, []);

    // Ref to track all preview URLs
    const previewUrlsRef = useRef([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [retailer, setRetailer] = useState(null);
    const [employee, setEmployee] = useState(null);
    const [reportType, setReportType] = useState(null);
    const [remarks, setRemarks] = useState("");
    const [loadingEmployee, setLoadingEmployee] = useState(false);
    const [loadingRetailers, setLoadingRetailers] = useState(false);

    // Filtered options
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [filteredRetailers, setFilteredRetailers] = useState([]);

    // Stock fields
    const [stockType, setStockType] = useState(null);
    const [brand, setBrand] = useState("");
    const [product, setProduct] = useState("");
    const [sku, setSku] = useState("");
    const [productType, setProductType] = useState(null);
    const [quantity, setQuantity] = useState("");

    // File uploads
    const [shopDisplayImages, setShopDisplayImages] = useState([]);
    const [billCopies, setBillCopies] = useState([]);
    const [files, setFiles] = useState([]);

    // Preview URLs
    const [shopDisplayPreviews, setShopDisplayPreviews] = useState([]);
    const [billCopyPreviews, setBillCopyPreviews] = useState([]);
    const [filePreviews, setFilePreviews] = useState([]);

    // Initialize filtered options
    useEffect(() => {
        setFilteredEmployees(employees);
        setFilteredRetailers(retailers);
    }, [employees, retailers]);

    // Cleanup all preview URLs on unmount
    useEffect(() => {
        return () => {
            // Revoke all tracked URLs when component unmounts
            previewUrlsRef.current.forEach(url => {
                try {
                    URL.revokeObjectURL(url);
                } catch (e) {
                    // Ignore errors for already revoked URLs
                }
            });
            previewUrlsRef.current = [];
        };
    }, []);

    // Fetch assigned employee when retailer is selected
    const fetchAssignedEmployee = async (retailerId) => {
        setLoadingEmployee(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(
                `${API_URL}/admin/campaign/${campaignId}/retailer/${retailerId}/employee`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const data = await res.json();

            if (res.ok && data.isAssigned && data.employee) {
                const assignedEmp = employees.find(
                    (emp) => emp.value.toString() === data.employee._id.toString()
                );
                if (assignedEmp) {
                    setEmployee(assignedEmp);
                    setFilteredEmployees([assignedEmp]);
                } else {
                    setEmployee(null);
                    setFilteredEmployees([]);
                }
            } else {
                setEmployee(null);
                setFilteredEmployees([]);
            }
        } catch (err) {
            console.error("Error fetching assigned employee:", err);
            setEmployee(null);
            setFilteredEmployees([]);
        } finally {
            setLoadingEmployee(false);
        }
    };

    // Fetch assigned retailers when employee is selected
    const fetchAssignedRetailers = async (employeeId) => {
        setLoadingRetailers(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(
                `${API_URL}/admin/campaign/${campaignId}/employee-retailer-mapping`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const data = await res.json();

            if (res.ok && data.employees) {
                const empData = data.employees.find(
                    (e) => e._id.toString() === employeeId.toString()
                );

                if (empData && empData.retailers && empData.retailers.length > 0) {
                    const assignedRetailerIds = empData.retailers.map((r) =>
                        r._id.toString()
                    );
                    const assignedRetailerOptions = retailers.filter((r) =>
                        assignedRetailerIds.includes(r.value.toString())
                    );

                    setFilteredRetailers(assignedRetailerOptions);

                    if (assignedRetailerOptions.length === 1) {
                        setRetailer(assignedRetailerOptions[0]);
                    } else {
                        setRetailer(null);
                    }
                } else {
                    setFilteredRetailers([]);
                    setRetailer(null);
                }
            }
        } catch (err) {
            console.error("Error fetching assigned retailers:", err);
            setFilteredRetailers([]);
        } finally {
            setLoadingRetailers(false);
        }
    };

    const handleRetailerChange = (selected) => {
        setRetailer(selected);
        if (selected) {
            fetchAssignedEmployee(selected.value);
        } else {
            setEmployee(null);
            setFilteredEmployees(employees);
            setFilteredRetailers(retailers);
        }
    };

    const handleEmployeeChange = (selected) => {
        setEmployee(selected);
        if (selected) {
            fetchAssignedRetailers(selected.value);
        } else {
            setRetailer(null);
            setFilteredRetailers(retailers);
            setFilteredEmployees(employees);
        }
    };

    // Image handlers for Window Display
    const handleShopDisplayImageChange = (e) => {
        const newFiles = Array.from(e.target.files || []);
        setShopDisplayImages((prevFiles) => [...prevFiles, ...newFiles]);

        // Create and track preview URLs
        const newPreviews = newFiles.map(file => {
            const url = URL.createObjectURL(file);
            previewUrlsRef.current.push(url); // Track in ref
            return url;
        });
        setShopDisplayPreviews(prev => [...prev, ...newPreviews]);

        e.target.value = "";
    };

    const removeShopDisplayImage = (index) => {
        const urlToRevoke = shopDisplayPreviews[index];
        
        // Revoke the URL and remove from tracking
        try {
            URL.revokeObjectURL(urlToRevoke);
            previewUrlsRef.current = previewUrlsRef.current.filter(u => u !== urlToRevoke);
        } catch (e) {
            // Ignore errors for already revoked URLs
        }

        setShopDisplayImages((prevFiles) => prevFiles.filter((_, i) => i !== index));
        setShopDisplayPreviews(prev => prev.filter((_, i) => i !== index));
    };

    // Bill copy handlers for Stock
    const handleBillCopyChange = (e) => {
        const newFiles = Array.from(e.target.files || []);
        setBillCopies((prevFiles) => [...prevFiles, ...newFiles]);

        // Create and track preview URLs
        const newPreviews = newFiles.map(file => {
            const url = URL.createObjectURL(file);
            previewUrlsRef.current.push(url); // Track in ref
            return url;
        });
        setBillCopyPreviews(prev => [...prev, ...newPreviews]);

        e.target.value = "";
    };

    const removeBillCopy = (index) => {
        const urlToRevoke = billCopyPreviews[index];
        
        // Revoke the URL and remove from tracking
        try {
            URL.revokeObjectURL(urlToRevoke);
            previewUrlsRef.current = previewUrlsRef.current.filter(u => u !== urlToRevoke);
        } catch (e) {
            // Ignore errors for already revoked URLs
        }

        setBillCopies((prevFiles) => prevFiles.filter((_, i) => i !== index));
        setBillCopyPreviews(prev => prev.filter((_, i) => i !== index));
    };

    // File handlers for Others
    const handleFilesChange = (e) => {
        const newFiles = Array.from(e.target.files || []);
        setFiles((prevFiles) => [...prevFiles, ...newFiles]);

        // Create and track preview URLs
        const newPreviews = newFiles.map(file => {
            const url = URL.createObjectURL(file);
            previewUrlsRef.current.push(url); // Track in ref
            return url;
        });
        setFilePreviews(prev => [...prev, ...newPreviews]);

        e.target.value = "";
    };

    const removeFile = (index) => {
        const urlToRevoke = filePreviews[index];
        
        // Revoke the URL and remove from tracking
        try {
            URL.revokeObjectURL(urlToRevoke);
            previewUrlsRef.current = previewUrlsRef.current.filter(u => u !== urlToRevoke);
        } catch (e) {
            // Ignore errors for already revoked URLs
        }

        setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
        setFilePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const isImage = (file) =>
        file && ["image/png", "image/jpeg", "image/jpg"].includes(file.type);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!retailer || !reportType) {
            alert("Please select retailer and report type");
            return;
        }

        // Get admin ID from token
        const token = localStorage.getItem("token");
        let adminId;
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            adminId = payload.id || payload.userId;
        } catch (err) {
            console.error("Error parsing token:", err);
            alert("Authentication error. Please login again.");
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();

        // Campaign ID
        formData.append("campaignId", campaignId);

        // Report Type
        formData.append("reportType", reportType.value);

        // Submitted By (Admin)
        formData.append("submittedBy[role]", "Admin");
        formData.append("submittedBy[userId]", adminId);

        // Retailer Information
        formData.append("retailer[retailerId]", retailer.value);
        formData.append(
            "retailer[outletName]",
            retailer.data?.shopDetails?.shopName || "N/A"
        );
        formData.append("retailer[retailerName]", retailer.data?.name || "N/A");
        formData.append("retailer[outletCode]", retailer.data?.uniqueId || "N/A");

        // Employee Information (if selected)
        if (employee) {
            formData.append("employee[employeeId]", employee.value);
            formData.append("employee[employeeName]", employee.data?.name || "N/A");
            formData.append(
                "employee[employeeCode]",
                employee.data?.employeeId || "N/A"
            );
        }

        // Remarks
        if (remarks) {
            formData.append("remarks", remarks);
        }

        // Stock Report Fields
        if (reportType.value === "Stock") {
            if (stockType) formData.append("stockType", stockType.value);
            if (brand) formData.append("brand", brand);
            if (product) formData.append("product", product);
            if (sku) formData.append("sku", sku);
            if (productType) formData.append("productType", productType.value);
            if (quantity) formData.append("quantity", quantity);

            // Append bill copies
            billCopies.forEach((billCopy) => {
                formData.append("billCopies", billCopy);
            });
        }

        // Window Display Images
        if (reportType.value === "Window Display") {
            shopDisplayImages.forEach((image) => {
                formData.append("shopDisplayImages", image);
            });
        }

        // Others Files
        if (reportType.value === "Others") {
            files.forEach((file) => {
                formData.append("files", file);
            });
        }

        try {
            await onSubmit(formData);
        } catch (error) {
            console.error("Submit error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl max-w-5xl w-full my-8"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="max-h-[85vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white z-10 border-b p-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-[#E4002B]">
                                Submit New Report
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700 ml-2"
                            >
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block font-medium mb-1">
                                    Retailer *
                                </label>
                                <Select
                                    styles={customSelectStyles}
                                    options={filteredRetailers}
                                    value={retailer}
                                    onChange={handleRetailerChange}
                                    placeholder="Select Retailer"
                                    isSearchable
                                    isLoading={loadingRetailers}
                                    isClearable
                                />
                                {filteredRetailers.length === 0 && employee && (
                                    <p className="text-sm text-red-500 mt-1">
                                        No retailers assigned to this employee
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block font-medium mb-1">
                                    Employee (Optional){" "}
                                    {loadingEmployee && (
                                        <span className="text-sm text-gray-500">
                                            (Loading...)
                                        </span>
                                    )}
                                </label>
                                <Select
                                    styles={customSelectStyles}
                                    options={filteredEmployees}
                                    value={employee}
                                    onChange={handleEmployeeChange}
                                    placeholder="Select Employee"
                                    isSearchable
                                    isLoading={loadingEmployee}
                                    isClearable
                                />
                                {filteredEmployees.length === 0 && retailer && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        No employee assigned to this retailer
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block font-medium mb-1">
                                    Type of Report *
                                </label>
                                <Select
                                    styles={customSelectStyles}
                                    options={reportTypes}
                                    value={reportType}
                                    onChange={setReportType}
                                    placeholder="Select Report Type"
                                    isSearchable
                                />
                            </div>

                            {/* STOCK REPORT */}
                            {reportType?.value === "Stock" && (
                                <div className="space-y-3 bg-blue-50 p-4 rounded-md border border-blue-200">
                                    <h3 className="font-semibold text-gray-700">
                                        Stock Information
                                    </h3>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Stock Type
                                        </label>
                                        <Select
                                            styles={customSelectStyles}
                                            options={stockTypeOptions}
                                            value={stockType}
                                            onChange={setStockType}
                                            placeholder="Select Stock Type"
                                            isSearchable
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Brand"
                                            value={brand}
                                            onChange={(e) => setBrand(e.target.value)}
                                            className="border rounded p-2 w-full"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Product"
                                            value={product}
                                            onChange={(e) => setProduct(e.target.value)}
                                            className="border rounded p-2 w-full"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="SKU"
                                            value={sku}
                                            onChange={(e) => setSku(e.target.value)}
                                            className="border rounded p-2 w-full"
                                        />
                                        <Select
                                            styles={customSelectStyles}
                                            options={productTypeOptions}
                                            value={productType}
                                            onChange={setProductType}
                                            placeholder="Product Type"
                                            isSearchable
                                        />
                                    </div>

                                    <input
                                        type="number"
                                        placeholder="Quantity"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className="border rounded p-2 w-full"
                                    />

                                    {/* Bill Copies */}
                                    <div>
                                        <label className="block font-medium mb-1">
                                            Bill Copies{" "}
                                            <span className="text-red-500">
                                                (Multiple Images Allowed)
                                            </span>
                                        </label>
                                        <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-[#E4002B]">
                                            <FiPlus className="text-3xl text-gray-400" />
                                            <span>Click to upload bill copies</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                onChange={handleBillCopyChange}
                                            />
                                        </label>

                                        {billCopies.length > 0 && (
                                            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {billCopies.map((file, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative border-2 border-dashed rounded-lg overflow-hidden bg-gray-50 group"
                                                    >
                                                        {isImage(file) ? (
                                                            <img
                                                                src={billCopyPreviews[index]}
                                                                className="w-full h-32 object-cover"
                                                                alt={`bill-preview-${index}`}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-32 flex items-center justify-center bg-gray-100">
                                                                <p className="text-sm text-gray-600 px-2 text-center">
                                                                    {file?.name &&
                                                                        file.name.length > 20
                                                                        ? file.name.substring(
                                                                            0,
                                                                            17
                                                                        ) + "..."
                                                                        : file?.name}
                                                                </p>
                                                            </div>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeBillCopy(index)
                                                            }
                                                            className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <FiX size={16} />
                                                        </button>
                                                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                                                            {file?.name &&
                                                                file.name.length > 15
                                                                ? file.name.substring(
                                                                    0,
                                                                    12
                                                                ) + "..."
                                                                : file?.name}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {billCopies.length > 0 && (
                                            <p className="text-sm text-gray-600 mt-3">
                                                {billCopies.length} bill cop
                                                {billCopies.length !== 1 ? "ies" : "y"}{" "}
                                                uploaded
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* WINDOW DISPLAY */}
                            {reportType?.value === "Window Display" && (
                                <div>
                                    <label className="block font-medium mb-1">
                                        Upload Shop Display Images{" "}
                                        <span className="text-red-500">
                                            (Multiple Images Allowed)
                                        </span>
                                    </label>
                                    <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-[#E4002B]">
                                        <FiPlus className="text-3xl text-gray-400" />
                                        <span>Click to upload shop display images</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={handleShopDisplayImageChange}
                                        />
                                    </label>

                                    {shopDisplayImages.length > 0 && (
                                        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {shopDisplayImages.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="relative border-2 border-dashed rounded-lg overflow-hidden bg-gray-50 group"
                                                >
                                                    <img
                                                        src={shopDisplayPreviews[index]}
                                                        className="w-full h-32 object-cover"
                                                        alt={`preview-${index}`}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeShopDisplayImage(index)
                                                        }
                                                        className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <FiX size={16} />
                                                    </button>
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                                                        {file?.name && file.name.length > 15
                                                            ? file.name.substring(0, 12) +
                                                            "..."
                                                            : file?.name}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {shopDisplayImages.length > 0 && (
                                        <p className="text-sm text-gray-600 mt-3">
                                            {shopDisplayImages.length} image
                                            {shopDisplayImages.length !== 1 ? "s" : ""}{" "}
                                            uploaded
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* OTHERS REPORT */}
                            {reportType?.value === "Others" && (
                                <div>
                                    <label className="block font-medium mb-1">
                                        Upload Files{" "}
                                        <span className="text-red-500">
                                            (Multiple Files Allowed)
                                        </span>
                                    </label>

                                    <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-[#E4002B]">
                                        <FiPlus className="text-3xl text-gray-400" />
                                        <span>Click to upload files</span>
                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            multiple
                                            className="hidden"
                                            onChange={handleFilesChange}
                                        />
                                    </label>

                                    {files.length > 0 && (
                                        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {files.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="relative border-2 border-dashed rounded-lg overflow-hidden bg-gray-50 group"
                                                >
                                                    {isImage(file) ? (
                                                        <img
                                                            src={filePreviews[index]}
                                                            className="w-full h-32 object-cover"
                                                            alt={`preview-${index}`}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-32 flex items-center justify-center bg-gray-100">
                                                            <p className="text-sm text-gray-600 px-2 text-center">
                                                                {file?.name.length > 20
                                                                    ? file.name.substring(
                                                                        0,
                                                                        17
                                                                    ) + "..."
                                                                    : file.name}
                                                            </p>
                                                        </div>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(index)}
                                                        className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <FiX size={16} />
                                                    </button>

                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                                                        {file?.name.length > 15
                                                            ? file.name.substring(0, 12) +
                                                            "..."
                                                            : file?.name}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {files.length > 0 && (
                                        <p className="text-sm text-gray-600 mt-3">
                                            {files.length} file{files.length !== 1 ? "s" : ""}{" "}
                                            uploaded
                                        </p>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block font-medium mb-1">Remarks</label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    className="border rounded p-2 w-full"
                                    rows="3"
                                    placeholder="Add any remarks..."
                                />
                            </div>

                            <div className="flex gap-3 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-[#E4002B] text-white rounded-md hover:bg-[#C3002B] disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? "Submitting..." : "Submit Report"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubmitReportModal;
