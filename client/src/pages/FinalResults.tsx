// src/pages/FinalResults.tsx
import React, { useEffect, useState } from "react";
import { useWsClient } from "ws-request-hook";
// @ts-ignore
import { FinalGameResultsDto, PlayerFinalResultDto } from "src/generated-client";
import { useNavigate } from "react-router-dom";

export default function FinalResults() {
    const { onMessage } = useWsClient();
    const navigate = useNavigate();
    const [finalResults, setFinalResults] = useState<FinalGameResultsDto | null>(null);

    useEffect(() => {
        const unsubscribe = onMessage("FinalGameResultsDto", (data: any) => {
            const results = data as FinalGameResultsDto;
            console.log("Final game results:", results);
            setFinalResults(results);
        });
        return () => unsubscribe();
    }, [onMessage]);

    const goToLobby = () => {
        navigate("/lobby");
    };

    if (!finalResults) {
        return <p>Waiting for final results...</p>;
    }

    return (
        <div style={{ padding: "2rem", textAlign: "center" }}>
            <h1>Final Game Results</h1>
            <h2>Scores:</h2>
            <ul style={{ listStyle: "none", padding: 0 }}>
                {finalResults.Players.map((player: PlayerFinalResultDto) => (
                    <li key={player.PlayerId} style={{ margin: "1rem 0", fontSize: "1.2rem" }}>
                        {player.Nickname}: {player.Score} point{player.Score !== 1 ? "s" : ""}
                    </li>
                ))}
            </ul>
            <h2>Winner{finalResults.Winners.length > 1 ? "s" : ""}:</h2>
            <ul style={{ listStyle: "none", padding: 0 }}>
                {finalResults.Winners.map((player: PlayerFinalResultDto) => (
                    <li key={player.PlayerId} style={{ margin: "1rem 0", fontSize: "1.2rem", fontWeight: "bold" }}>
                        {player.Nickname} ({player.Score} point{player.Score !== 1 ? "s" : ""})
                    </li>
                ))}
            </ul>
            <button
                onClick={goToLobby}
                style={{
                    marginTop: "2rem",
                    padding: "1rem 2rem",
                    fontSize: "1.2rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    backgroundColor: "#805ad5",
                    color: "#fff",
                    cursor: "pointer",
                }}
            >
                Return to Lobby
            </button>
        </div>
    );
}
