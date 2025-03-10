import React, { useState, useEffect } from "react";
import { useWsClient } from "ws-request-hook";
// @ts-ignore
import { ServerSendsQuestionDto, ClientAnswersQuestionDto, ServerShowsResultsDto } from "src/generated-client";
// @ts-ignore
import { QuestionOptionDto } from "src/generated-client";

export default function PlayerGame() {
    const { onMessage, send } = useWsClient();
    const [question, setQuestion] = useState<ServerSendsQuestionDto | null>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [timer, setTimer] = useState<number>(0);
    const [results, setResults] = useState<ServerShowsResultsDto | null>(null);

    // Припустимо, що ідентифікатор гравця зберігається в state після входу (це потрібно реалізувати окремо)
    const [playerId, setPlayerId] = useState<string>(""); // Замініть на фактичний id

    // Наприклад, ви можете отримати id гравця при вході та зберегти його:
    useEffect(() => {
        // Приклад: отримання id з localStorage чи іншого джерела
        const storedId = localStorage.getItem("playerId");
        if (storedId) {
            setPlayerId(storedId);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onMessage("ServerSendsQuestionDto", (data: any) => {
            const newQuestion = data as ServerSendsQuestionDto;
            console.log("Received question:", newQuestion);
            setQuestion(newQuestion);
            setSelectedOption(null);
            setResults(null);
            setTimer(newQuestion.timeLimit ?? 10);
        });
        return () => unsubscribe();
    }, [onMessage]);

    useEffect(() => {
        const unsubscribe = onMessage("ServerShowsResultsDto", (data: any) => {
            const resultsDto = data as ServerShowsResultsDto;
            console.log("Received results:", resultsDto);
            setResults(resultsDto);
            setTimer(0);
        });
        return () => unsubscribe();
    }, [onMessage]);

    useEffect(() => {
        if (timer <= 0) return;
        const interval = setInterval(() => {
            setTimer(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [timer]);

    const submitAnswer = () => {
        if (!question || !selectedOption) return;
        const dto: ClientAnswersQuestionDto = {
            eventType: "ClientAnswersQuestionDto",
            requestId: crypto.randomUUID(),
            gameId: "game-001", // Переконайтеся, що це відповідає грі
            questionId: question.questionId,
            selectedOptionId: selectedOption,
        };
        send(dto);
    };

    // Замість жорсткого рядка "YOUR_PLAYER_ID", використовуємо змінну playerId
    const answerMessage = results && results.Results && results.Results.some((r: any) => r.PlayerId === playerId)
        ? "Your answer was correct!"
        : "Your answer was incorrect.";

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "linear-gradient(to bottom, #f8f9fa, #e9ecef)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
            }}
        >
            {question ? (
                <div
                    style={{
                        background: "#fff",
                        borderRadius: "0.5rem",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                        padding: "2rem",
                        maxWidth: "600px",
                        width: "100%",
                        textAlign: "center",
                    }}
                >
                    <h1
                        style={{
                            fontSize: "2.5rem",
                            marginBottom: "1.5rem",
                            color: "#333",
                        }}
                    >
                        {question.questionText}
                    </h1>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "1rem",
                            marginBottom: "2rem",
                        }}
                    >
                        {question.options?.map((option: QuestionOptionDto) => (
                            <button
                                key={option.optionId}
                                onClick={() => setSelectedOption(option.optionId!)}
                                disabled={timer === 0 || results !== null}
                                style={{
                                    padding: "1rem",
                                    fontSize: "1.2rem",
                                    borderRadius: "0.5rem",
                                    border:
                                        selectedOption === option.optionId
                                            ? "3px solid #805ad5"
                                            : "2px solid #ccc",
                                    background:
                                        selectedOption === option.optionId ? "#e9d8fd" : "#fff",
                                    cursor: timer > 0 && results === null ? "pointer" : "default",
                                    transition: "all 0.3s ease",
                                }}
                            >
                                {option.optionText}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={submitAnswer}
                        disabled={!selectedOption || timer === 0 || results !== null}
                        style={{
                            backgroundColor: "#805ad5",
                            color: "#fff",
                            padding: "1rem 2rem",
                            border: "none",
                            borderRadius: "0.5rem",
                            fontSize: "1.2rem",
                            cursor: timer > 0 && results === null ? "pointer" : "default",
                            transition: "background 0.3s ease",
                        }}
                    >
                        Submit Answer
                    </button>
                    <div
                        style={{
                            marginTop: "1rem",
                            fontSize: "1.5rem",
                            fontWeight: "bold",
                            color: "#f56565",
                        }}
                    >
                        Time left: {timer} seconds
                    </div>
                    {results && (
                        <div
                            style={{
                                marginTop: "1rem",
                                fontSize: "1.5rem",
                                color: "#333",
                            }}
                        >
                            {answerMessage}
                        </div>
                    )}
                </div>
            ) : (
                <p style={{ fontSize: "1.5rem", color: "#666" }}>Waiting for question...</p>
            )}
        </div>
    );
}
