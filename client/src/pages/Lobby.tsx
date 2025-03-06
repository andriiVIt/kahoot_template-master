import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWsClient } from "ws-request-hook";
// Імпортуємо DTO, якщо треба
// @ts-ignore
import {ClientEntersLobbyDto, ServerPutsClientInLobbyAndBroadcastsToEveryoneDto, PlayerInfoDto,} from "src/generated-client";

export default function Lobby() {
    const { onMessage, send, readyState } = useWsClient();
    const navigate = useNavigate();

    const [nickname, setNickname] = useState("");
    const [lobbyPlayers, setLobbyPlayers] = useState<PlayerInfoDto[]>([]);

    // Приєднання до лобі
    const joinLobby = () => {
        if (readyState !== 1) {
            console.log("WebSocket not ready");
            return;
        }
        const dto: ClientEntersLobbyDto = {
            eventType: "ClientEntersLobbyDto",
            requestId: crypto.randomUUID(),
            nickname,
        };
        send(dto);
    };

    // Слухати оновлення списку лобі
    useEffect(() => {
        const unsubLobby = onMessage(
            "ServerPutsClientInLobbyAndBroadcastsToEveryoneDto",
            (data) => {
                const casted = data as ServerPutsClientInLobbyAndBroadcastsToEveryoneDto;
                setLobbyPlayers(casted.allPlayers ?? []);
            }
        );

        // Слухати подію про початок гри
        const unsubGameStarted = onMessage(
            "ServerTellsPlayersGameStarted",
            // Можна прокинути (data) => { ... }
            // і зкастити до ServerTellsPlayersGameStartedDto, але не обов'язково
            () => {
                // Коли приходить подія, переводимо на сторінку /game
                navigate("/game");
            }
        );

        return () => {
            unsubLobby();
            unsubGameStarted();
        };
    }, [onMessage, navigate]);

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(to bottom, #c2a8ff 0%, white 100%)",
            display: "flex", flexDirection: "column",
            alignItems: "center", padding: "2rem"
        }}>
            <h1 style={{
                fontSize: "2.5rem", fontWeight: "bold",
                marginBottom: "1.5rem", color: "#4a4a4a"
            }}>
                Kahoot Clone Lobby
            </h1>

            <div style={{
                backgroundColor: "#fff",
                padding: "1.5rem",
                borderRadius: "0.5rem",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                width: "100%", maxWidth: "400px"
            }}>
                <div style={{ marginBottom: "1rem" }}>
                    <label style={{
                        display: "block", marginBottom: "0.5rem",
                        fontSize: "1.1rem", fontWeight: 500, color: "#4a4a4a"
                    }}>
                        Enter your nickname
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Jane123"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        style={{
                            width: "100%", padding: "0.5rem",
                            border: "1px solid #ccc",
                            borderRadius: "0.25rem",
                            fontSize: "1rem"
                        }}
                    />
                </div>
                <button
                    onClick={joinLobby}
                    style={{
                        width: "100%", backgroundColor: "#805ad5",
                        color: "#fff", fontWeight: 600,
                        padding: "0.75rem", borderRadius: "0.25rem",
                        border: "none", cursor: "pointer", fontSize: "1rem"
                    }}
                >
                    Join Lobby
                </button>
            </div>

            <div style={{
                marginTop: "2rem", backgroundColor: "#fff",
                padding: "1.5rem", borderRadius: "0.5rem",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                width: "100%", maxWidth: "400px"
            }}>
                <h2 style={{
                    fontSize: "1.5rem", fontWeight: 600,
                    marginBottom: "1rem", color: "#4a4a4a"
                }}>
                    Lobby Players
                </h2>
                {lobbyPlayers.length === 0 ? (
                    <p style={{ color: "#666" }}>No players have joined yet.</p>
                ) : (
                    <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
                        {lobbyPlayers.map((player) => (
                            <li key={player.id} style={{
                                background: "#f4f4f4", marginBottom: "0.5rem",
                                padding: "0.75rem", borderRadius: "0.3rem",
                                fontSize: "1.1rem", color: "#333"
                            }}>
                                {player.nickname}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
