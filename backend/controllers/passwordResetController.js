import { Retailer } from "../models/retailer.model.js";
import { otpStore } from "../utils/sms/otpStore.js";

// Step 1: Initiate password reset (send OTP)
export const initiatePasswordReset = async (req, res) => {
    try {
        const { phone } = req.body;
        console.log("📞 Received phone:", phone);

        const cleanPhone = phone?.toString().trim().replace(/\D/g, "");
        console.log("🧹 Cleaned phone:", cleanPhone);

        if (!cleanPhone || cleanPhone.length !== 10) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid 10-digit phone number",
            });
        }

        // Log all retailers to debug
        const totalRetailers = await Retailer.countDocuments();

        // Try multiple search patterns
        let retailer = await Retailer.findOne({ contactNo: cleanPhone });
        console.log(
            "🔍 Search result (exact):",
            retailer ? "FOUND" : "NOT FOUND",
        );

        if (!retailer) {
            // Try with country code
            retailer = await Retailer.findOne({ contactNo: `91${cleanPhone}` });
            console.log(
                "🔍 Search result (with 91):",
                retailer ? "FOUND" : "NOT FOUND",
            );
        }

        if (!retailer) {
            // Try with leading zero
            retailer = await Retailer.findOne({ contactNo: `0${cleanPhone}` });
            console.log(
                "🔍 Search result (with 0):",
                retailer ? "FOUND" : "NOT FOUND",
            );
        }

        if (!retailer) {
            // Get a sample retailer to see the format
            const sampleRetailer = await Retailer.findOne({}).select(
                "contactNo name",
            );
            console.log("📝 Sample retailer:", sampleRetailer);

            return res.status(404).json({
                success: false,
                message:
                    "Phone number not registered. Please check and try again.",
                debug: {
                    searchedPhone: cleanPhone,
                    totalRetailers: totalRetailers,
                    sampleContactNo: sampleRetailer?.contactNo,
                },
            });
        }

        console.log("✅ Retailer found:", retailer.name);

        if (otpStore.setResetFlag) {
            otpStore.setResetFlag(cleanPhone, true);
        }

        res.status(200).json({
            success: true,
            message: "Phone number verified. Please request OTP to proceed.",
            phoneExists: true,
        });
    } catch (error) {
        console.error("Password Reset Initiation Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to initiate password reset",
            error: error.message,
        });
    }
};

// Step 2: Verify OTP and reset password
export const resetPassword = async (req, res) => {
    console.log("✅ resetPassword controller called");

    try {
        const { phone, otp, newPassword } = req.body;

        const cleanPhone = phone?.toString().trim().replace(/\D/g, "");

        if (!cleanPhone || cleanPhone.length !== 10) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number",
            });
        }

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long",
            });
        }

        if (!otp || otp.length !== 6) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP format",
            });
        }

        // Verify OTP
        const storedData = otpStore.get(cleanPhone);

        if (!storedData) {
            return res.status(404).json({
                success: false,
                message: "OTP not found. Please request a new one.",
            });
        }

        if (otpStore.isExpired(cleanPhone)) {
            otpStore.delete(cleanPhone);
            return res.status(410).json({
                success: false,
                message: "OTP expired. Please request a new one.",
            });
        }

        if (storedData.attempts >= 5) {
            otpStore.delete(cleanPhone);
            return res.status(429).json({
                success: false,
                message: "Maximum verification attempts exceeded",
            });
        }

        if (storedData.otp !== otp) {
            otpStore.incrementAttempts(cleanPhone);
            return res.status(401).json({
                success: false,
                message: "Invalid OTP",
            });
        }

        // Find retailer by contactNo (phone number field)
        const retailer = await Retailer.findOne({ contactNo: cleanPhone });

        if (!retailer) {
            return res.status(404).json({
                success: false,
                message: "Retailer not found",
            });
        }

        // Update the PASSWORD field (not contactNo)
        // The pre-save hook will automatically hash it
        retailer.password = newPassword;
        await retailer.save();

        // Delete OTP
        otpStore.delete(cleanPhone);

        res.status(200).json({
            success: true,
            message: "Password reset successfully",
        });
    } catch (error) {
        console.error("Password Reset Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to reset password",
        });
    }
};
