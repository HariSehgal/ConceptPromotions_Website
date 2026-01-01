import React from "react";

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

const ReportDetailsModal = ({ report, onClose }) => {
    if (!report) return null;

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
                                Report Details
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
                                            {report.retailer?.retailerId?.contactNo || "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </div>

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
                                                report.dateOfSubmission || report.createdAt
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
                                            Shop Display Images ({report.shopDisplayImages.length})
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {report.shopDisplayImages.map((img, idx) => {
                                                const imageSource = bufferToBase64(
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
                                            })}
                                        </div>
                                    </div>
                                )}

                            {/* Bill Copies */}
                            {report.reportType === "Stock" &&
                                report.billCopies &&
                                report.billCopies.length > 0 && (
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                            Bill {report.billCopies.length > 1 ? "Copies" : "Copy"} (
                                            {report.billCopies.length})
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
                                                            {bill.fileName || `Bill ${idx + 1}`}
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportDetailsModal;
