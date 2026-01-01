import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";

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

const frequencyOptions = [
    { value: "Daily", label: "Daily" },
    { value: "Weekly", label: "Weekly" },
    { value: "Fortnightly", label: "Fortnightly" },
    { value: "Monthly", label: "Monthly" },
    { value: "Adhoc", label: "Adhoc" },
];

const ReportDetailsModal = ({ report, onClose, onUpdate, onDelete }) => {
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, []);

    const [isEditing, setIsEditing] = useState(false);

    // Form state
    const [reportType, setReportType] = useState(
        reportTypes.find((rt) => rt.value === report.reportType) || null
    );
    const [frequency, setFrequency] = useState(
        frequencyOptions.find((f) => f.value === report.frequency) || null
    );
    const [stockType, setStockType] = useState(
        stockTypeOptions.find((st) => st.value === report.stockType) || null
    );
    const [productType, setProductType] = useState(
        productTypeOptions.find((pt) => pt.value === report.productType) || null
    );

    const [brand, setBrand] = useState(report.brand || "");
    const [product, setProduct] = useState(report.product || "");
    const [sku, setSku] = useState(report.sku || "");
    const [quantity, setQuantity] = useState(report.quantity || "");
    const [remarks, setRemarks] = useState(report.remarks || "");

    const [images, setImages] = useState([]);
    const [billCopies, setBillCopies] = useState([]);
    const [files, setFiles] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [removedImageIndices, setRemovedImageIndices] = useState([]);
    const [removedBillIndices, setRemovedBillIndices] = useState([]);
    const [removedFileIndices, setRemovedFileIndices] = useState([]);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "N/A";
            return date.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        } catch (error) {
            return "N/A";
        }
    };

    const handleImageChange = (e) => {
        const newFiles = Array.from(e.target.files || []);
        if (newFiles.length > 0) {
            setImages((prevFiles) => [...prevFiles, ...newFiles]);
        }
        e.target.value = "";
    };

    const removeImage = (index) => {
        setImages((prevFiles) => prevFiles.filter((_, i) => i !== index));
    };

    const removeCurrentImage = (index) => {
        setRemovedImageIndices((prev) => [...prev, index]);
    };

    const handleBillCopy = (e) => {
        const newFiles = Array.from(e.target.files || []);
        if (newFiles.length > 0) {
            setBillCopies((prevFiles) => [...prevFiles, ...newFiles]);
        }
        e.target.value = "";
    };

    const removeBill = (index) => {
        setBillCopies((prevFiles) => prevFiles.filter((_, i) => i !== index));
    };

    const removeCurrentBill = (index) => {
        setRemovedBillIndices((prev) => [...prev, index]);
    };

    const handleFilesChange = (e) => {
        const newFiles = Array.from(e.target.files || []);
        if (newFiles.length > 0) {
            setFiles((prevFiles) => [...prevFiles, ...newFiles]);
        }
        e.target.value = "";
    };

    const removeFile = (index) => {
        setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    };

    const removeCurrentFile = (index) => {
        setRemovedFileIndices((prev) => [...prev, index]);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!reportType) {
            alert("Please select a report type");
            return;
        }

        setIsSaving(true);

        const formData = new FormData();

        // Append basic fields
        formData.append("reportType", reportType.value);
        if (frequency) formData.append("frequency", frequency.value);
        if (remarks) formData.append("remarks", remarks);

        // ✅ Send removed indices to backend
        if (removedImageIndices.length > 0) {
            formData.append("removedImageIndices", JSON.stringify(removedImageIndices));
        }
        if (removedBillIndices.length > 0) {
            formData.append("removedBillIndices", JSON.stringify(removedBillIndices));
        }
        if (removedFileIndices.length > 0) {
            formData.append("removedFileIndices", JSON.stringify(removedFileIndices));
        }

        // Append stock fields (if stock type)
        if (reportType?.value === "Stock") {
            if (stockType) formData.append("stockType", stockType.value);
            if (brand) formData.append("brand", brand);
            if (product) formData.append("product", product);
            if (sku) formData.append("sku", sku);
            if (productType) formData.append("productType", productType.value);
            if (quantity) formData.append("quantity", quantity);

            // Handle bill copies - ONLY append new uploads
            if (billCopies.length > 0) {
                billCopies.forEach((file) => formData.append("billCopies", file));
            }
        }

        // Append images for Window Display - ONLY append new uploads
        if (reportType?.value === "Window Display" && images.length > 0) {
            images.forEach((image) => formData.append("shopDisplayImages", image));
        }

        // Append files for Others - ONLY append new uploads
        if (reportType?.value === "Others" && files.length > 0) {
            files.forEach((file) => formData.append("files", file));
        }

        try {
            console.log("📤 Sending update for report:", report._id);

            // ✅ Call the parent's onUpdate function
            await onUpdate(report._id, formData);

            console.log("✅ Update complete, closing modal");

            // ✅ Exit edit mode
            setIsEditing(false);

            // ✅ Close the modal (parent will handle refresh)
            onClose();

        } catch (error) {
            console.error("❌ Failed to update report:", error);
            alert("Failed to update report. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await onDelete(report._id);
        } catch (error) {
            console.error("Failed to delete report:", error);
            alert("Failed to delete report. Please try again.");
        }
    };

    useEffect(() => {
        if (isEditing) {
            setReportType(
                reportTypes.find((rt) => rt.value === report.reportType) || null
            );
            setFrequency(
                frequencyOptions.find((f) => f.value === report.frequency) || null
            );
            setStockType(
                stockTypeOptions.find((st) => st.value === report.stockType) || null
            );
            setProductType(
                productTypeOptions.find((pt) => pt.value === report.productType) ||
                null
            );
            setBrand(report.brand || "");
            setProduct(report.product || "");
            setSku(report.sku || "");
            setQuantity(report.quantity || "");
            setRemarks(report.remarks || "");
            setImages([]);
            setBillCopies([]);
            setFiles([]);
            setRemovedImageIndices([]);
            setRemovedBillIndices([]);
            setRemovedFileIndices([]);
        }
    }, [isEditing, report]);

    // Helper function to convert Buffer to base64
    const bufferToBase64 = (buffer, contentType) => {
        if (!buffer || !buffer.data) return null;

        try {
            if (buffer.type === "Buffer" && Array.isArray(buffer.data)) {
                const base64 = btoa(
                    buffer.data.reduce(
                        (data, byte) => data + String.fromCharCode(byte),
                        ""
                    )
                );
                return `data:${contentType || "image/jpeg"};base64,${base64}`;
            }
            return null;
        } catch (error) {
            console.error("Error converting buffer to base64:", error);
            return null;
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
                                {isEditing ? "Edit Report" : "Report Details"}
                            </h2>
                            <div className="flex items-center gap-3">
                                {!isEditing ? (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition"
                                        >
                                            Delete
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition disabled:bg-gray-400"
                                        >
                                            {isSaving ? "Saving..." : "Save Changes"}
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (
                                                    window.confirm("Discard all changes?")
                                                ) {
                                                    setIsEditing(false);
                                                }
                                            }}
                                            className="bg-gray-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-600 transition"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={onClose}
                                    className="text-gray-500 hover:text-gray-700 ml-2"
                                >
                                    <span className="text-2xl">&times;</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {isEditing ? (
                            // EDIT MODE
                            <form className="space-y-6">
                                {/* Campaign Info - Read Only */}
                                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                                    <h3 className="text-lg font-semibold mb-3 text-gray-700">
                                        Campaign Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium text-gray-600">
                                                Campaign:
                                            </span>
                                            <p className="text-gray-800">
                                                {report.campaignId?.name || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-600">
                                                Type:
                                            </span>
                                            <p className="text-gray-800">
                                                {report.campaignId?.type || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-600">
                                                Client:
                                            </span>
                                            <p className="text-gray-800">
                                                {report.campaignId?.client || "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Retailer - Non-editable */}
                                <div className="bg-gray-100 p-4 rounded-lg border">
                                    <label className="block font-medium mb-2 text-gray-700">
                                        Retailer (Cannot be changed)
                                    </label>
                                    <div className="bg-white p-3 rounded border">
                                        <p className="font-semibold text-gray-800">
                                            {report.retailer?.retailerName || "N/A"}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {report.retailer?.outletName} •{" "}
                                            {report.retailer?.outletCode}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {report.retailer?.retailerId?.shopDetails
                                                ?.shopAddress?.city || "N/A"}
                                            ,{" "}
                                            {report.retailer?.retailerId?.shopDetails
                                                ?.shopAddress?.state || "N/A"}
                                        </p>
                                    </div>
                                </div>

                                {/* Employee - Non-editable */}
                                {report.employee?.employeeName && (
                                    <div className="bg-gray-100 p-4 rounded-lg border">
                                        <label className="block font-medium mb-2 text-gray-700">
                                            Employee (Cannot be changed)
                                        </label>
                                        <div className="bg-white p-3 rounded border">
                                            <p className="font-semibold text-gray-800">
                                                {report.employee?.employeeName || "N/A"}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {report.employee?.employeeCode || "N/A"}
                                            </p>
                                            {report.employee?.employeeId?.phone && (
                                                <p className="text-sm text-gray-500">
                                                    {report.employee.employeeId.phone}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Report Type */}
                                <div>
                                    <label className="block font-medium mb-2">
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

                                {/* Frequency */}
                                <div>
                                    <label className="block font-medium mb-2">
                                        Frequency
                                    </label>
                                    <Select
                                        styles={customSelectStyles}
                                        options={frequencyOptions}
                                        value={frequency}
                                        onChange={setFrequency}
                                        placeholder="Select Frequency"
                                        isSearchable
                                        isClearable
                                    />
                                </div>

                                {/* STOCK REPORT FIELDS */}
                                {reportType?.value === "Stock" && (
                                    <div className="space-y-4 bg-blue-50 p-4 rounded-md border border-blue-200">
                                        <h3 className="text-lg font-semibold text-gray-700">
                                            Stock Information
                                        </h3>

                                        <div>
                                            <label className="block font-medium mb-2">
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

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-medium mb-2">
                                                    Brand
                                                </label>
                                                <input
                                                    type="text"
                                                    value={brand}
                                                    onChange={(e) =>
                                                        setBrand(e.target.value)
                                                    }
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#E4002B] focus:outline-none"
                                                    placeholder="Brand"
                                                />
                                            </div>
                                            <div>
                                                <label className="block font-medium mb-2">
                                                    Product
                                                </label>
                                                <input
                                                    type="text"
                                                    value={product}
                                                    onChange={(e) =>
                                                        setProduct(e.target.value)
                                                    }
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#E4002B] focus:outline-none"
                                                    placeholder="Product"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-medium mb-2">
                                                    SKU
                                                </label>
                                                <input
                                                    type="text"
                                                    value={sku}
                                                    onChange={(e) => setSku(e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#E4002B] focus:outline-none"
                                                    placeholder="SKU"
                                                />
                                            </div>
                                            <div>
                                                <label className="block font-medium mb-2">
                                                    Product Type
                                                </label>
                                                <Select
                                                    styles={customSelectStyles}
                                                    options={productTypeOptions}
                                                    value={productType}
                                                    onChange={setProductType}
                                                    placeholder="Select Product Type"
                                                    isSearchable
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block font-medium mb-2">
                                                Quantity
                                            </label>
                                            <input
                                                type="number"
                                                value={quantity}
                                                onChange={(e) =>
                                                    setQuantity(e.target.value)
                                                }
                                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#E4002B] focus:outline-none"
                                                placeholder="Quantity"
                                            />
                                        </div>

                                        {/* Current Bill Copies */}
                                        {report.billCopies &&
                                            report.billCopies.length > 0 && (
                                                <div className="mb-4">
                                                    <p className="text-sm font-medium text-gray-600 mb-2">
                                                        Current Bill Copies (
                                                        {
                                                            report.billCopies.filter(
                                                                (_, idx) =>
                                                                    !removedBillIndices.includes(
                                                                        idx
                                                                    )
                                                            ).length
                                                        }
                                                        ):
                                                    </p>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                        {report.billCopies.map(
                                                            (bill, idx) => {
                                                                if (
                                                                    removedBillIndices.includes(
                                                                        idx
                                                                    )
                                                                )
                                                                    return null;

                                                                const imageSource =
                                                                    bufferToBase64(
                                                                        bill.data,
                                                                        bill.contentType
                                                                    );
                                                                if (!imageSource)
                                                                    return null;

                                                                return (
                                                                    <div
                                                                        key={idx}
                                                                        className="relative group"
                                                                    >
                                                                        <img
                                                                            src={imageSource}
                                                                            alt={`Bill ${idx + 1
                                                                                }`}
                                                                            className="w-full h-32 object-cover rounded border"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                removeCurrentBill(
                                                                                    idx
                                                                                )
                                                                            }
                                                                            className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </div>
                                                                );
                                                            }
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                        {/* New Bill Copy Upload */}
                                        <div>
                                            <label className="block font-medium mb-2">
                                                {billCopies.length > 0
                                                    ? "Add More Bill Copies"
                                                    : "Upload Bill Copies"}
                                            </label>
                                            <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-[#E4002B]">
                                                <span className="text-3xl text-gray-400">
                                                    +
                                                </span>
                                                <span>
                                                    Click to upload bill copies (multiple
                                                    allowed)
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                    onChange={handleBillCopy}
                                                />
                                            </label>

                                            {billCopies.length > 0 && (
                                                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                                                    {billCopies.map((file, index) => (
                                                        <div
                                                            key={index}
                                                            className="relative group"
                                                        >
                                                            <img
                                                                src={URL.createObjectURL(
                                                                    file
                                                                )}
                                                                className="w-full h-32 object-cover rounded border"
                                                                alt={`New Bill ${index + 1
                                                                    }`}
                                                            />
                                                            <button
                                                                type="button"
                                                                className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() =>
                                                                    removeBill(index)
                                                                }
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Remarks */}
                                <div>
                                    <label className="block font-medium mb-2">
                                        Remarks
                                    </label>
                                    <textarea
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#E4002B] focus:outline-none"
                                        placeholder="Add remarks..."
                                        rows="3"
                                    />
                                </div>

                                {/* WINDOW DISPLAY - Images */}
                                {reportType?.value === "Window Display" && (
                                    <div>
                                        {report.shopDisplayImages &&
                                            report.shopDisplayImages.length > 0 && (
                                                <div className="mb-4">
                                                    <p className="text-sm font-medium text-gray-600 mb-2">
                                                        Current Images (
                                                        {
                                                            report.shopDisplayImages.filter(
                                                                (_, idx) =>
                                                                    !removedImageIndices.includes(
                                                                        idx
                                                                    )
                                                            ).length
                                                        }
                                                        ):
                                                    </p>
                                                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                                                        {report.shopDisplayImages.map(
                                                            (img, idx) => {
                                                                if (
                                                                    removedImageIndices.includes(
                                                                        idx
                                                                    )
                                                                )
                                                                    return null;

                                                                const imageSource =
                                                                    bufferToBase64(
                                                                        img.data,
                                                                        img.contentType
                                                                    );
                                                                if (!imageSource)
                                                                    return null;

                                                                return (
                                                                    <div
                                                                        key={idx}
                                                                        className="relative group"
                                                                    >
                                                                        <img
                                                                            src={imageSource}
                                                                            alt={`Current ${idx + 1
                                                                                }`}
                                                                            className="w-full h-20 object-cover rounded border"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                removeCurrentImage(
                                                                                    idx
                                                                                )
                                                                            }
                                                                            className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </div>
                                                                );
                                                            }
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                        <label className="block font-medium mb-2">
                                            {report.shopDisplayImages &&
                                                report.shopDisplayImages.length > 0
                                                ? "Add More Images"
                                                : "Upload Images"}
                                        </label>
                                        <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-[#E4002B]">
                                            <span className="text-3xl text-gray-400">
                                                +
                                            </span>
                                            <span>Click to upload new images</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                onChange={handleImageChange}
                                            />
                                        </label>

                                        {images.length > 0 && (
                                            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {images.map((file, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative border-2 border-dashed rounded-lg overflow-hidden bg-gray-50 group"
                                                    >
                                                        <img
                                                            src={URL.createObjectURL(file)}
                                                            className="w-full h-32 object-cover"
                                                            alt={`preview-${index}`}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(index)}
                                                            className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full p-1"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* OTHERS - Files */}
                                {reportType?.value === "Others" && (
                                    <div>
                                        {report.files && report.files.length > 0 && (
                                            <div className="mb-4">
                                                <p className="text-sm font-medium text-gray-600 mb-2">
                                                    Current Files (
                                                    {
                                                        report.files.filter(
                                                            (_, idx) =>
                                                                !removedFileIndices.includes(
                                                                    idx
                                                                )
                                                        ).length
                                                    }
                                                    ):
                                                </p>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                    {report.files.map((file, idx) => {
                                                        if (
                                                            removedFileIndices.includes(
                                                                idx
                                                            )
                                                        )
                                                            return null;

                                                        const imageSource =
                                                            bufferToBase64(
                                                                file.data,
                                                                file.contentType
                                                            );
                                                        if (!imageSource) return null;

                                                        return (
                                                            <div
                                                                key={idx}
                                                                className="relative group"
                                                            >
                                                                <img
                                                                    src={imageSource}
                                                                    alt={`File ${idx + 1}`}
                                                                    className="w-full h-32 object-cover rounded border"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        removeCurrentFile(idx)
                                                                    }
                                                                    className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <label className="block font-medium mb-2">
                                            {report.files && report.files.length > 0
                                                ? "Add More Files"
                                                : "Upload Files"}
                                        </label>
                                        <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-[#E4002B]">
                                            <span className="text-3xl text-gray-400">
                                                +
                                            </span>
                                            <span>Click to upload files</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                onChange={handleFilesChange}
                                            />
                                        </label>

                                        {files.length > 0 && (
                                            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {files.map((file, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative group"
                                                    >
                                                        <img
                                                            src={URL.createObjectURL(file)}
                                                            className="w-full h-32 object-cover rounded border"
                                                            alt={`New File ${index + 1}`}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="absolute top-1 right-1 bg-[#E4002B] text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => removeFile(index)}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </form>
                        ) : (
                            // VIEW MODE
                            <div className="space-y-6">
                                {/* Basic Info */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                        Basic Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Report Type
                                            </label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                {report.reportType || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Submitted By
                                            </label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                {report.submittedBy?.role || "N/A"}
                                            </p>
                                        </div>
                                        {report.frequency && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                                    Frequency
                                                </label>
                                                <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                    {report.frequency}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Campaign Info */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                        Campaign Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Campaign Name
                                            </label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                {report.campaignId?.name || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Campaign Type
                                            </label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                {report.campaignId?.type || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Client
                                            </label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                {report.campaignId?.client || "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Retailer Info */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                        Retailer Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Retailer Name
                                            </label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                {report.retailer?.retailerName || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Outlet Code
                                            </label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                {report.retailer?.outletCode || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Outlet Name
                                            </label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                {report.retailer?.outletName || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Contact
                                            </label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                {report.retailer?.retailerId
                                                    ?.contactNo || "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Employee Info */}
                                {report.employee?.employeeName && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                            Employee Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                                    Employee Name
                                                </label>
                                                <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                    {report.employee.employeeName}
                                                </p>
                                            </div>
                                            {report.employee.employeeCode && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                                        Employee Code
                                                    </label>
                                                    <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                        {report.employee.employeeCode}
                                                    </p>
                                                </div>
                                            )}
                                            {report.employee.employeeId?.phone && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                                        Phone
                                                    </label>
                                                    <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                        {report.employee.employeeId.phone}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Employee Visit Details in View Mode */}
                                {report.submittedBy?.role === "Employee" && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                            Visit Details
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                                    Type of Visit
                                                </label>
                                                <p className="text-gray-800 bg-white px-3 py-2 rounded capitalize">
                                                    {report.typeOfVisit || "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                                    Attendance Status
                                                </label>
                                                <p className={`px-3 py-2 rounded bg-white text-gray-800`}>
                                                    {report.attendedVisit === "yes" ? "Attended" : "Not Attended"}
                                                </p>
                                            </div>
                                            {report.attendedVisit === "no" && report.reasonForNonAttendance && (
                                                <>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                                            Reason
                                                        </label>
                                                        <p className="text-gray-800 bg-white px-3 py-2 rounded capitalize">
                                                            {report.reasonForNonAttendance.reason || "N/A"}
                                                        </p>
                                                    </div>
                                                    {report.reasonForNonAttendance.reason === "others" && report.reasonForNonAttendance.otherReason && (
                                                        <div className="md:col-span-2">
                                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                                Additional Details
                                                            </label>
                                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                                {report.reasonForNonAttendance.otherReason}
                                                            </p>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Product/Stock Info */}
                                {report.reportType === "Stock" &&
                                    (report.brand ||
                                        report.product ||
                                        report.sku ||
                                        report.stockType) && (
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                                Product/Stock Information
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {report.stockType && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                                            Stock Type
                                                        </label>
                                                        <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                            {report.stockType}
                                                        </p>
                                                    </div>
                                                )}
                                                {report.brand && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                                            Brand
                                                        </label>
                                                        <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                            {report.brand}
                                                        </p>
                                                    </div>
                                                )}
                                                {report.product && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                                            Product
                                                        </label>
                                                        <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                            {report.product}
                                                        </p>
                                                    </div>
                                                )}
                                                {report.sku && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                                            SKU
                                                        </label>
                                                        <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                            {report.sku}
                                                        </p>
                                                    </div>
                                                )}
                                                {report.productType && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                                            Product Type
                                                        </label>
                                                        <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                            {report.productType}
                                                        </p>
                                                    </div>
                                                )}
                                                {report.quantity && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                                            Quantity
                                                        </label>
                                                        <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                            {report.quantity}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                {/* Date Info */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                        Date Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Submitted On
                                            </label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                                {formatDate(
                                                    report.dateOfSubmission ||
                                                    report.createdAt
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Remarks */}
                                {report.remarks && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                            Remarks
                                        </h3>
                                        <p className="text-gray-800 bg-white px-3 py-2 rounded">
                                            {report.remarks}
                                        </p>
                                    </div>
                                )}

                                {/* Shop Display Images */}
                                {report.reportType === "Window Display" &&
                                    report.shopDisplayImages &&
                                    report.shopDisplayImages.length > 0 && (
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                                Shop Display Images (
                                                {report.shopDisplayImages.length})
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                {report.shopDisplayImages.map(
                                                    (img, idx) => {
                                                        const imageSource =
                                                            bufferToBase64(
                                                                img.data,
                                                                img.contentType
                                                            );
                                                        if (!imageSource) return null;

                                                        return (
                                                            <div
                                                                key={idx}
                                                                className="relative bg-black rounded-lg overflow-hidden"
                                                                style={{ height: "200px" }}
                                                            >
                                                                <img
                                                                    src={imageSource}
                                                                    alt={`Display ${idx + 1}`}
                                                                    className="w-full h-full object-contain"
                                                                />
                                                            </div>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        </div>
                                    )}

                                {/* Bill Copies */}
                                {report.reportType === "Stock" &&
                                    report.billCopies &&
                                    report.billCopies.length > 0 && (
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                                Bill{" "}
                                                {report.billCopies.length > 1
                                                    ? "Copies"
                                                    : "Copy"}{" "}
                                                ({report.billCopies.length})
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {report.billCopies.map((bill, idx) => {
                                                    const imageSource = bufferToBase64(
                                                        bill.data,
                                                        bill.contentType
                                                    );
                                                    if (!imageSource) return null;

                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="relative bg-black rounded-lg overflow-hidden"
                                                            style={{ height: "300px" }}
                                                        >
                                                            <img
                                                                src={imageSource}
                                                                alt={`Bill Copy ${idx + 1}`}
                                                                className="w-full h-full object-contain"
                                                            />
                                                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                                                                {bill.fileName ||
                                                                    `Bill ${idx + 1}`}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                {/* Other Files */}
                                {report.reportType === "Others" &&
                                    report.files &&
                                    report.files.length > 0 && (
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                                Files ({report.files.length})
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {report.files.map((file, idx) => {
                                                    const imageSource = bufferToBase64(
                                                        file.data,
                                                        file.contentType
                                                    );
                                                    if (!imageSource) return null;

                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="relative bg-black rounded-lg overflow-hidden"
                                                            style={{ height: "200px" }}
                                                        >
                                                            <img
                                                                src={imageSource}
                                                                alt={`File ${idx + 1}`}
                                                                className="w-full h-full object-contain"
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportDetailsModal;
