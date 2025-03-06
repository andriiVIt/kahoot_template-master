// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { WsClientProvider } from "ws-request-hook";
import { Toaster } from "react-hot-toast";
import Lobby from "./pages/Lobby";
// @ts-ignore
import PlayerGame from "./pages/PlayerGame";
// @ts-ignore
import AdminGame from "./pages/AdminGame";
// @ts-ignore
const baseUrl = import.meta.env.VITE_API_BASE_URL;

export default function App() {
    return (
        <WsClientProvider url={baseUrl + "?id=" + crypto.randomUUID()}>
            <Toaster />
            <Router>
                <nav style={{ marginBottom: "1rem" }}>
                    <Link to="/">Lobby</Link> | <Link to="/game">Player Game</Link> |{" "}
                    <Link to="/admin">Admin Panel</Link>
                </nav>
                <Routes>
                    <Route path="/" element={<Lobby />} />
                    <Route path="/game" element={<PlayerGame />} />
                    <Route path="/admin" element={<AdminGame />} />
                </Routes>
            </Router>
        </WsClientProvider>
    );
}
