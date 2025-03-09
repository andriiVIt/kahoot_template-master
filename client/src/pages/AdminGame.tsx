import React, { useEffect, useState } from "react";
import { useWsClient } from "ws-request-hook";
// @ts-ignore
import {AdminStartsGameDto, AdminRequestsNextQuestionDto, PlayerInfoDto, ServerPutsClientInLobbyAndBroadcastsToEveryoneDto,} from "src/generated-client";

export default function AdminPanel() {
    const { send, onMessage, readyState } = useWsClient();

    // Список гравців, які повертаються з бекенду
    const [lobbyPlayers, setLobbyPlayers] = useState<PlayerInfoDto[]>([]);
    const [timer, setTimer] = useState(0);

    // Слухаємо подію оновлення списку гравців у лобі
    useEffect(() => {
        const unsubscribe = onMessage(
            "ServerPutsClientInLobbyAndBroadcastsToEveryoneDto",
            (data) => {
                console.log("Received lobby update:", data);
                const casted = data as ServerPutsClientInLobbyAndBroadcastsToEveryoneDto;
                setLobbyPlayers(casted.allPlayers ?? []);
            }
        );
        return () => unsubscribe();
    }, [onMessage]);

    useEffect(() => {
        // Додамо адміна до топіку "lobby" при старті адмін-панелі
        // (якщо це необхідно для тесту)
        const joinAsAdmin = () => {
            if (readyState !== 1) return;
            const dto = {
                eventType: "ClientEntersLobbyDto",
                requestId: crypto.randomUUID(),
                nickname: "Admin", // або будь-який нік для адміна
            };
            send(dto);
        };
        joinAsAdmin();
    }, [readyState, send]);
    useEffect(() => {
        const unsubscribe = onMessage(
            "ServerPutsClientInLobbyAndBroadcastsToEveryoneDto",
            (data) => {
                const casted = data as ServerPutsClientInLobbyAndBroadcastsToEveryoneDto;
                // Фільтруємо, щоб не показувати гравця з нікнеймом "Admin"
                const filteredPlayers = (casted.allPlayers ?? []).filter(
                    (player: { nickname: string; }) => player.nickname !== "Admin"
                );
                setLobbyPlayers(filteredPlayers);
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
            gameId: "game-001", // або GUID
        };
        console.log("Sending AdminStartsGameDto:", dto);
        send(dto);
    };
    const endQuestion = () => {
        if (readyState !== 1) return;
        const dto = {
            eventType: "AdminRequestsEndQuestionDto",
            requestId: crypto.randomUUID(),
            gameId: "game-001",
            questionId: "currentQuestionId" // потрібно якось зберігати поточне питання
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
        console.log("Sending AdminRequestsNextQuestionDto:", dto);
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

            <div style={{textAlign: "center"}}>
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
                <button onClick={endQuestion}>
                    End Question
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
