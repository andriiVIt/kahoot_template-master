// src/pages/PlayerGame.tsx
import { useState, useEffect } from "react";
import { useWsClient } from "ws-request-hook";
// @ts-ignore
import { ServerSendsQuestionDto, ClientAnswersQuestionDto, ServerShowsResultsDto } from "src/generated-client";
// @ts-ignore
import { QuestionOptionDto } from "src/generated-client";

export default function PlayerGame() {
    const { onMessage, send } = useWsClient();

    // Стан для поточного питання
    const [question, setQuestion] = useState<ServerSendsQuestionDto | null>(null);
    // Стан для вибраного варіанту відповіді
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    // Таймер (секунди)
    const [timer, setTimer] = useState<number>(0);
    // Стан для результатів (якщо отримано)
    const [results, setResults] = useState<ServerShowsResultsDto | null>(null);

    // Слухаємо подію нового питання
    useEffect(() => {
        const unsubscribe = onMessage("ServerSendsQuestionDto", (data: any) => {
            const newQuestion = data as ServerSendsQuestionDto;
            console.log("Received question:", newQuestion);
            setQuestion(newQuestion);
            setSelectedOption(null);
            setResults(null);
            // Якщо сервер задає тайм-ліміт, використовуємо його, інакше 10 секунд
            // Переконайтеся, що бекенд надсилає поле timeLimit у camelCase (якщо не – використовуйте дефолт 10)
            setTimer((newQuestion as any).timeLimit ?? 10);
        });
        return () => unsubscribe();
    }, [onMessage]);

    // Слухаємо подію результатів
    useEffect(() => {
        const unsubscribe = onMessage("ServerShowsResultsDto", (data: any) => {
            const resultsDto = data as ServerShowsResultsDto;
            console.log("Received results:", resultsDto);
            setResults(resultsDto);
            // Зупиняємо таймер, щоб UI не дозволяв взаємодію
            setTimer(0);
        });
        return () => unsubscribe();
    }, [onMessage]);

    // Таймер: зменшуємо значення кожну секунду
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

    // Дозволено взаємодіяти, якщо таймер > 0 і результати ще не отримані
    const canInteract = timer > 0 && results === null;

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
                                disabled={!canInteract}
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
                                    cursor: canInteract ? "pointer" : "default",
                                    transition: "all 0.3s ease",
                                }}
                            >
                                {option.optionText}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={submitAnswer}
                        disabled={!selectedOption || !canInteract}
                        style={{
                            backgroundColor: "#805ad5",
                            color: "#fff",
                            padding: "1rem 2rem",
                            border: "none",
                            borderRadius: "0.5rem",
                            fontSize: "1.2rem",
                            cursor: canInteract ? "pointer" : "default",
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
                            {/* Тут ви можете відобразити результати, наприклад: */}
                            {results.Results && results.Results.some((r: any) => r.PlayerId === "YOUR_PLAYER_ID")
                                ? "Your answer was correct!"
                                : "Your answer was incorrect."}
                        </div>
                    )}
                </div>
            ) : (
                <p style={{ fontSize: "1.5rem", color: "#666" }}>Waiting for question...</p>
            )}
        </div>
    );
}
