// admin/retailer.controller.js
import bcrypt from "bcryptjs";
import XLSX from "xlsx";
import { Retailer } from "../../models/retailer.model.js";
import { Employee, Campaign, Payment } from "../../models/user.js";

// Utility to generate unique IDs (same implementation as original)
function generateUniqueId() {
    const letters = Array.from({ length: 4 }, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join("");
    const numbers = Math.floor(1000 + Math.random() * 9000);
    return `${letters}${numbers}`;
}

// ====== REGISTER RETAILER (single) ======
export const registerRetailer = async (req, res) => {
    try {
        const body = req.body;
        const files = req.files || {};
        const { contactNo, email } = body;

        if (!email || !contactNo)
            return res
                .status(400)
                .json({ message: "Email and contact number are required" });

        // Must verify OTP before registration
        if (otpStore.has(contactNo)) {
            return res.status(400).json({
                message: "Please verify your phone number before registration",
            });
        }

        const personalAddress = {
            address: body.address,
            city: body.city,
            state: body.state,
            geoTags: {
                lat: parseFloat(body.geoTags?.lat) || 0,
                lng: parseFloat(body.geoTags?.lng) || 0,
            },
        };

        const shopAddress = {
            address:
                body["shopDetails.shopAddress.address"] || body.shopAddress,
            city: body["shopDetails.shopAddress.city"] || body.shopCity,
            state: body["shopDetails.shopAddress.state"] || body.shopState,
            pincode:
                body["shopDetails.shopAddress.pincode"] || body.shopPincode,
            geoTags: {
                lat:
                    parseFloat(body["shopDetails.shopAddress.geoTags.lat"]) ||
                    0,
                lng:
                    parseFloat(body["shopDetails.shopAddress.geoTags.lng"]) ||
                    0,
            },
        };

        // ========================================
        // CLOUDINARY UPLOAD - Outlet Photo
        // ========================================
        let outletPhotoData;
        if (files.outletPhoto) {
            const result = await uploadToCloudinary(
                files.outletPhoto[0].buffer,
                "retailers/outlet_photos",
                getResourceType(files.outletPhoto[0].mimetype)
            );
            outletPhotoData = {
                url: result.secure_url,
                publicId: result.public_id,
            };
        }

        const shopDetails = {
            shopName: body["shopDetails.shopName"] || body.shopName,
            businessType: body["shopDetails.businessType"] || body.businessType,
            ownershipType:
                body["shopDetails.ownershipType"] || body.ownershipType,
            dateOfEstablishment:
                body["shopDetails.dateOfEstablishment"] ||
                body.dateOfEstablishment,
            GSTNo: body["shopDetails.GSTNo"] || body.GSTNo,
            PANCard: body["shopDetails.PANCard"] || body.PANCard,
            shopAddress,
            outletPhoto: outletPhotoData,
        };

        const bankDetails = {
            bankName: body["bankDetails.bankName"] || body.bankName,
            accountNumber:
                body["bankDetails.accountNumber"] || body.accountNumber,
            IFSC: body["bankDetails.IFSC"] || body.IFSC,
            branchName: body["bankDetails.branchName"] || body.branchName,
        };

        const existingRetailer = await Retailer.findOne({
            $or: [{ contactNo }, { email }],
        });
        if (existingRetailer)
            return res
                .status(400)
                .json({ message: "Phone or email already registered" });

        // ========================================
        // CLOUDINARY UPLOAD - All Photos
        // ========================================
        let govtIdPhotoData, personPhotoData, registrationFormFileData;

        if (files.govtIdPhoto) {
            const result = await uploadToCloudinary(
                files.govtIdPhoto[0].buffer,
                "retailers/govt_id",
                getResourceType(files.govtIdPhoto[0].mimetype)
            );
            govtIdPhotoData = {
                url: result.secure_url,
                publicId: result.public_id,
            };
        }

        if (files.personPhoto) {
            const result = await uploadToCloudinary(
                files.personPhoto[0].buffer,
                "retailers/person_photos",
                getResourceType(files.personPhoto[0].mimetype)
            );
            personPhotoData = {
                url: result.secure_url,
                publicId: result.public_id,
            };
        }

        if (files.registrationFormFile) {
            const result = await uploadToCloudinary(
                files.registrationFormFile[0].buffer,
                "retailers/registration_forms",
                getResourceType(files.registrationFormFile[0].mimetype)
            );
            registrationFormFileData = {
                url: result.secure_url,
                publicId: result.public_id,
            };
        }

        const retailer = new Retailer({
            name: body.name,
            contactNo,
            email,
            dob: body.dob,
            gender: body.gender,
            govtIdType: body.govtIdType,
            govtIdNumber: body.govtIdNumber,
            govtIdPhoto: govtIdPhotoData,
            personPhoto: personPhotoData,
            registrationFormFile: registrationFormFileData,
            personalAddress,
            shopDetails,
            bankDetails,
            partOfIndia: body.partOfIndia || "N",
            createdBy: body.createdBy || "RetailerSelf",
            phoneVerified: true,
        });

        await retailer.save();

        res.status(201).json({
            message: "Retailer registered successfully",
            uniqueId: retailer.uniqueId,
        });
    } catch (error) {
        console.error("Retailer registration error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ====== BULK REGISTER RETAILERS ======
export const bulkRegisterRetailers = async (req, res) => {
    try {
        // Only admins can bulk upload retailers
        if (!req.user || req.user.role !== "admin") {
            return res
                .status(403)
                .json({ message: "Only admins can upload retailers" });
        }

        if (!req.file) {
            return res
                .status(400)
                .json({ message: "Excel/CSV file is required" });
        }

        // Read Excel
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        const retailersToInsert = [];
        const failedRows = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            const {
                // SHOP DETAILS
                shopName,
                shopAddress,
               
                shopCity,
                shopState,
                shopPincode,
                GSTNo,
                businessType,
                ownershipType,

                // RETAILER DETAILS
                name,
                PANCard,
                contactNo,
                email,
                gender,
                govtIdType,
                govtIdNumber,

                // BANK DETAILS
                bankName,
                accountNumber,
                IFSC,
                branchName,
            } = row;

            /* ---------------- VALIDATION ---------------- */

            const missingFields = [];
            if (!shopName) missingFields.push("shopName");
            if (!shopAddress) missingFields.push("shopAddress");
            if (!shopCity) missingFields.push("shopCity");
            if (!shopState) missingFields.push("shopState");
            if (!shopPincode) missingFields.push("shopPincode");
            if (!businessType) missingFields.push("businessType");
            if (!name) missingFields.push("name");
            if (!PANCard) missingFields.push("PANCard");
            if (!contactNo) missingFields.push("contactNo");
            if (!email) missingFields.push("email");
            if (!bankName) missingFields.push("bankName");
            if (!accountNumber) missingFields.push("accountNumber");
            if (!IFSC) missingFields.push("IFSC");
            if (!branchName) missingFields.push("branchName");

            if (missingFields.length > 0) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Missing required fields: ${missingFields.join(", ")}`,
                    data: row,
                });
                continue;
            }

            // Duplicate check
            const exists = await Retailer.findOne({
                $or: [{ email }, { contactNo }],
            });

            if (exists) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Duplicate entry: Email or Contact already exists`,
                    data: row,
                });
                continue;
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Invalid email format`,
                    data: row,
                });
                continue;
            }

            // Contact validation
            const contactRegex = /^[6-9]\d{9}$/;
            if (!contactRegex.test(String(contactNo))) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Invalid contact number`,
                    data: row,
                });
                continue;
            }

            // Pincode validation
            if (String(shopPincode).length !== 6) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: `Invalid pincode`,
                    data: row,
                });
                continue;
            }

            /* ---------------- BUILD RETAILER ---------------- */
            try {
                retailersToInsert.push({
                    name,
                    email,
                    contactNo,
                    password: String(contactNo), // ✅ schema will hash

                    gender: gender || "",
                    govtIdType: govtIdType || "",
                    govtIdNumber: govtIdNumber || "",

                    shopDetails: {
                        shopName,
                        businessType,
                        PANCard,
                        ownershipType: ownershipType || "",
                        GSTNo: GSTNo || "",
                        shopAddress: {
                            address: shopAddress,
                            address2: shopAddress2 || "",
                            city: shopCity,
                            state: shopState,
                            pincode: shopPincode,
                        },
                    },

                    bankDetails: {
                        bankName,
                        accountNumber,
                        IFSC,
                        branchName,
                    },

                    createdBy: "AdminAdded",
                    phoneVerified: true,
                });
            } catch (err) {
                failedRows.push({
                    rowNumber: i + 2,
                    reason: err.message,
                    data: row,
                });
            }
        }

        /* ---------------- INSERT ---------------- */

        let insertedRetailers = [];
        if (retailersToInsert.length > 0) {
            insertedRetailers = await Retailer.insertMany(
                retailersToInsert,
                { ordered: false } // continue on partial failures
            );
        }

        const response = {
            success: true,
            summary: {
                totalRows: rows.length,
                successful: insertedRetailers.length,
                failed: failedRows.length,
                successRate: `${(
                    (insertedRetailers.length / rows.length) *
                    100
                ).toFixed(2)}%`,
            },
            insertedRetailers: insertedRetailers.map((r) => ({
                id: r._id,
                name: r.name,
                email: r.email,
                contactNo: r.contactNo,
                uniqueId: r.uniqueId,
                retailerCode: r.retailerCode,
            })),
            failedRows,
        };

        if (insertedRetailers.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No retailers were added",
                ...response,
            });
        }

        if (failedRows.length > 0) {
            return res.status(207).json({
                message: "Partial success",
                ...response,
            });
        }

        return res.status(201).json({
            message: "All retailers added successfully",
            ...response,
        });
    } catch (error) {
        console.error("Bulk retailer upload error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};


// ====== UPDATE RETAILER DATES (in campaign) ======
export const updateRetailerDates = async (req, res) => {
    try {
        const { campaignId, retailerId } = req.params;
        const { startDate, endDate } = req.body;

        // admin check
        if (!req.user || req.user.role !== "admin")
            return res
                .status(403)
                .json({ message: "Only admin can update dates" });

        const campaign = await Campaign.findById(campaignId);
        if (!campaign)
            return res.status(404).json({ message: "Campaign not found" });

        const retailerEntry = campaign.assignedRetailers.find(
            (r) => r.retailerId.toString() === retailerId.toString()
        );

        if (!retailerEntry)
            return res
                .status(404)
                .json({ message: "Retailer not assigned to this campaign" });

        // Update only if values are provided
        if (startDate) retailerEntry.startDate = new Date(startDate);
        if (endDate) retailerEntry.endDate = new Date(endDate);
        retailerEntry.updatedAt = new Date();

        await campaign.save();

        res.status(200).json({
            message: "Retailer dates updated successfully",
            retailer: retailerEntry,
        });
    } catch (err) {
        console.error("Retailer date update error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ====== GET ALL RETAILERS ======
export const getAllRetailers = async (req, res) => {
    try {
        // Fetch ALL retailers with ALL fields
        const retailers = await Retailer.find().lean(); // full fields

        res.status(200).json({ retailers });
    } catch (err) {
        console.error("Get retailers error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ====== ASSIGN EMPLOYEE TO RETAILER ======
export const assignEmployeeToRetailer = async (req, res) => {
    try {
        const { campaignId, retailerId, employeeId } = req.body;

        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ message: "Only admins can assign" });
        }

        if (!campaignId || !retailerId || !employeeId) {
            return res.status(400).json({
                message: "campaignId, retailerId and employeeId are required",
            });
        }

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // -------------------------------
        // 1️⃣ Check retailer is part of campaign
        // -------------------------------
        const retailerExists = campaign.assignedRetailers.some(
            (r) => r.retailerId.toString() === retailerId.toString()
        );

        if (!retailerExists) {
            return res.status(400).json({
                message: "Retailer is not assigned to this campaign",
            });
        }

        // -------------------------------
        // 2️⃣ Check employee is part of campaign
        // -------------------------------
        const employeeExists = campaign.assignedEmployees.some(
            (e) => e.employeeId.toString() === employeeId.toString()
        );

        if (!employeeExists) {
            return res.status(400).json({
                message: "Employee is not assigned to this campaign",
            });
        }

        // -------------------------------
        // 3️⃣ Prevent duplicate mapping
        // -------------------------------
        const alreadyMapped = campaign.assignedEmployeeRetailers.some(
            (entry) =>
                entry.employeeId.toString() === employeeId.toString() &&
                entry.retailerId.toString() === retailerId.toString()
        );

        if (alreadyMapped) {
            return res.status(400).json({
                message: "Employee is already assigned to this retailer",
            });
        }

        // -------------------------------
        // 4️⃣ Save mapping
        // -------------------------------
        campaign.assignedEmployeeRetailers.push({
            employeeId,
            retailerId,
            assignedAt: new Date(),
        });

        await campaign.save();

        res.status(200).json({
            message: "Employee assigned to retailer successfully",
            mapping: campaign.assignedEmployeeRetailers,
        });
    } catch (err) {
        console.error("Assign employee to retailer error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ====== GET EMPLOYEE–RETAILER MAPPING ======
export const getEmployeeRetailerMapping = async (req, res) => {
    try {
        const { campaignId } = req.params;

        const campaign = await Campaign.findById(campaignId)
            .select("assignedEmployeeRetailers")
            .lean();

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // 🔒 SAFETY: ensure array always exists
        const mappings = Array.isArray(campaign.assignedEmployeeRetailers)
            ? campaign.assignedEmployeeRetailers
            : [];

        // ✅ If no mappings, return empty but VALID response
        if (mappings.length === 0) {
            return res.status(200).json({
                campaignId,
                totalEmployees: 0,
                employees: [],
            });
        }

        // Fetch employees
        const employeeIds = [...new Set(mappings.map((m) => m.employeeId))];

        const employees = await Employee.find({
            _id: { $in: employeeIds },
        }).lean();

        const employeeMap = {};
        employees.forEach((emp) => {
            employeeMap[emp._id.toString()] = {
                ...emp,
                retailers: [],
            };
        });

        // Fetch retailers
        const retailerIds = [...new Set(mappings.map((m) => m.retailerId))];

        const retailers = await Retailer.find({
            _id: { $in: retailerIds },
        }).lean();

        const retailerMap = {};
        retailers.forEach((ret) => {
            retailerMap[ret._id.toString()] = ret;
        });

        // Build employee → retailers mapping
        mappings.forEach((m) => {
            const eId = m.employeeId.toString();
            const rId = m.retailerId.toString();

            if (employeeMap[eId] && retailerMap[rId]) {
                employeeMap[eId].retailers.push({
                    ...retailerMap[rId],
                    assignedAt: m.assignedAt,
                });
            }
        });

        // Final response
        res.status(200).json({
            campaignId,
            totalEmployees: Object.keys(employeeMap).length,
            employees: Object.values(employeeMap),
        });
    } catch (err) {
        console.error("Employee→Retailer mapping fetch error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ====== GET ASSIGNED EMPLOYEE FOR RETAILER ======
export const getAssignedEmployeeForRetailer = async (req, res) => {
    try {
        const { campaignId, retailerId } = req.params;

        // Get the campaign with employee-retailer mapping
        const campaign = await Campaign.findById(campaignId)
            .select("assignedEmployeeRetailers")
            .lean();

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Find the employee mapped to this retailer
        const mapping = campaign.assignedEmployeeRetailers.find(
            (m) => m.retailerId.toString() === retailerId.toString()
        );

        // Retailer not assigned to any employee
        if (!mapping) {
            return res.status(200).json({
                campaignId,
                retailerId,
                isAssigned: false,
                employee: null,
                message:
                    "No employee assigned to this retailer in this campaign",
            });
        }

        // Fetch employee details now
        const employee = await Employee.findById(mapping.employeeId)
            .select("name email phone position")
            .lean();

        res.status(200).json({
            campaignId,
            retailerId,
            isAssigned: true,
            employee,
            assignedAt: mapping.assignedAt,
            message: "Employee assigned to this retailer",
        });
    } catch (err) {
        console.error("Error checking assigned employee:", err);
        res.status(500).json({ message: "Server error" });
    }
};
