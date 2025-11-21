
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginScreen from "./components/LoginScreen";
import { DashboardView } from "./components/DashboardView";

export function Router() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LoginScreen />} />
                <Route path="/dashboard" element={<DashboardView />} />
            </Routes>
        </BrowserRouter>
    )
}
