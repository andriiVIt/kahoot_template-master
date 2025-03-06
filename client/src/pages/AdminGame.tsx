import React, { useEffect, useState } from "react";
import { useWsClient } from "ws-request-hook";
// @ts-ignore
// @ts-ignore
import {AdminStartsGameDto, AdminRequestsNextQuestionDto, PlayerInfoDto, ServerPutsClientInLobbyAndBroadcastsToEveryoneDto,} from "src/generated-client";

export default function AdminPanel() {
    const { send, onMessage, readyState } = useWsClient();

    // Зберігаємо список гравців (PlayerInfoDto), які повертає сервер (з тієї ж події)
    const [lobbyPlayers, setLobbyPlayers] = useState<PlayerInfoDto[]>([]);
    const [timer, setTimer] = useState(0);

    // Слухаємо повідомлення, щоб оновити список гравців у лобі
    useEffect(() => {
        const unsubscribe = onMessage(
            "ServerPutsClientInLobbyAndBroadcastsToEveryoneDto",
            (data) => {
                const casted = data as ServerPutsClientInLobbyAndBroadcastsToEveryoneDto;
                setLobbyPlayers(casted.allPlayers ?? []);
            }
        );
        return () => unsubscribe();
    }, [onMessage]);

    // Логіка таймера: якщо timer > 0, зменшуємо на 1 щосекунди
    useEffect(() => {
        // @ts-ignore
        let interval: NodeJS.Timeout | null = null;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [timer]);

    const startGame = () => {
        if (readyState !== 1) return;
        const dto: AdminStartsGameDto = {
            eventType: "AdminStartsGameDto",
            requestId: crypto.randomUUID(),
            gameId: "game-001",
        };
        send(dto);
    };

    const nextQuestion = () => {
        if (readyState !== 1) return;
        const dto: AdminRequestsNextQuestionDto = {
            eventType: "AdminRequestsNextQuestionDto",
            requestId: crypto.randomUUID(),
            gameId: "game-001",
        };
        send(dto);
        setTimer(10); // Наприклад, 10-секундний таймер
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "linear-gradient(to bottom, #c2a8ff, white)",
                padding: "2rem",
            }}
        >
            <h1
                style={{
                    fontSize: "2.5rem",
                    fontWeight: "bold",
                    marginBottom: "1rem",
                    color: "#4a4a4a",
                    textAlign: "center",
                }}
            >
                Admin Panel
            </h1>

            <div
                style={{
                    margin: "0 auto",
                    maxWidth: "500px",
                    background: "#fff",
                    padding: "1rem",
                    borderRadius: "0.5rem",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                    marginBottom: "2rem",
                }}
            >
                <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Lobby Players</h2>
                {lobbyPlayers.length === 0 ? (
                    <p>No players in lobby yet.</p>
                ) : (
                    <ul style={{ listStyle: "none", padding: 0 }}>
                        {lobbyPlayers.map((player) => (
                            <li
                                key={player.id}
                                style={{
                                    background: "#f4f4f4",
                                    margin: "0.5rem 0",
                                    padding: "0.5rem",
                                    borderRadius: "0.3rem",
                                }}
                            >
                                {player.nickname}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div style={{ textAlign: "center" }}>
                <button
                    onClick={startGame}
                    style={{
                        backgroundColor: "#805ad5",
                        color: "#fff",
                        fontWeight: 600,
                        padding: "0.75rem 1.5rem",
                        borderRadius: "0.25rem",
                        border: "none",
                        marginRight: "1rem",
                        cursor: "pointer",
                    }}
                >
                    Start Game
                </button>
                <button
                    onClick={nextQuestion}
                    style={{
                        backgroundColor: "#48bb78",
                        color: "#fff",
                        fontWeight: 600,
                        padding: "0.75rem 1.5rem",
                        borderRadius: "0.25rem",
                        border: "none",
                        marginRight: "1rem",
                        cursor: "pointer",
                    }}
                >
                    Next Question
                </button>
            </div>

            {timer > 0 && (
                <div
                    style={{
                        fontSize: "1.5rem",
                        fontWeight: "bold",
                        color: "#f56565",
                        marginTop: "1rem",
                        textAlign: "center",
                    }}
                >
                    Time left: {timer} seconds
                </div>
            )}
        </div>
    );
}
