import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";

let hasShownToast = false;

const ProtectedRoute = ({ children, redirectTo = "/signin", tokenKey = "token" }) => {
    const token = localStorage.getItem(tokenKey);

    if (!token) {
        if (!hasShownToast) {
            hasShownToast = true;

            setTimeout(() => {
                toast.error("Please login first!", {
                    position: "top-right",
                    autoClose: 1500,
                    theme: "dark",
                });

                hasShownToast = false;
            }, 100);
        }

        return <Navigate to={redirectTo} replace />;
    }

    return children;
};

export default ProtectedRoute;
