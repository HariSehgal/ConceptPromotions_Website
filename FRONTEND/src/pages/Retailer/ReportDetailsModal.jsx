import React from "react";

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
                                        <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                                            {report.reportType || "N/A"}
                                        </p>
                                    </div>
                                    {report.frequency && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Frequency
                                            </label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                                                {report.frequency}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                            Date of Submission
                                        </label>
                                        <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                                            {formatDate(report.dateOfSubmission || report.createdAt)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                            Submitted By
                                        </label>
                                        <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                                            {report.submittedBy?.role || "N/A"}
                                        </p>
                                    </div>
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
                                        <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                                            {report.campaignId?.name || "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                            Campaign Type
                                        </label>
                                        <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                                            {report.campaignId?.type || "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                            Client
                                        </label>
                                        <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                                            {report.campaignId?.client || "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Employee Info */}
                            {report.employee?.employeeId && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                        Employee Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Employee Name
                                            </label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                                                {report.employee.employeeId.name || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Employee Code
                                            </label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                                                {report.employee.employeeId.employeeId || "N/A"}
                                            </p>
                                        </div>
                                        {report.employee.employeeId.phone && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                                    Contact
                                                </label>
                                                <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                                                    {report.employee.employeeId.phone}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Employee Visit Details (if submitted by employee) */}
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
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded border capitalize">
                                                {report.typeOfVisit || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                                Attendance Status
                                            </label>
                                            <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                                                {report.attendedVisit === "yes" ? "Attended" : "Not Attended"}
                                            </p>
                                        </div>
                                        {report.attendedVisit === "no" && report.reasonForNonAttendance && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                                        Reason
                                                    </label>
                                                    <p className="text-gray-800 bg-white px-3 py-2 rounded border capitalize">
                                                        {report.reasonForNonAttendance.reason || "N/A"}
                                                    </p>
                                                </div>
                                                {report.reasonForNonAttendance.reason === "others" && report.reasonForNonAttendance.otherReason && (
                                                    <div className="md:col-span-2">
                                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                                            Additional Details
                                                        </label>
                                                        <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                                                            {report.reasonForNonAttendance.otherReason}
                                                        </p>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Stock Information */}
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
                                                    <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                                                        {report.stockType}
                                                    </p>
                                                </div>
                                            )}
                                            {report.brand && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                                        Brand
                                                    </label>
                                                    <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                                                        {report.brand}
                                                    </p>
                                                </div>
                                            )}
                                            {report.product && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                                        Product
                                                    </label>
                                                    <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                                                        {report.product}
                                                    </p>
                                                </div>
                                            )}
                                            {report.sku && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                                        SKU
                                                    </label>
                                                    <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                                                        {report.sku}
                                                    </p>
                                                </div>
                                            )}
                                            {report.productType && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                                        Product Type
                                                    </label>
                                                    <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                                                        {report.productType}
                                                    </p>
                                                </div>
                                            )}
                                            {report.quantity && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                                        Quantity
                                                    </label>
                                                    <p className="text-gray-800 bg-white px-3 py-2 rounded border">
                                                        {report.quantity}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* Remarks */}
                            {report.remarks && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                        Remarks
                                    </h3>
                                    <p className="text-gray-800 bg-white px-3 py-2 rounded border">
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

                            {/* N/A Report Type Block */}
                            {!report.reportType && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-700">
                                        Additional Information
                                    </h3>
                                    <p className="text-gray-600 text-sm">
                                        This report does not have a specific type assigned.
                                    </p>
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
