import { useState, useEffect } from "react";
import { useWsClient } from "ws-request-hook";

// @ts-ignore
import { ServerSendsQuestionDto, ClientAnswersQuestionDto } from "src/generated-client";
import {QuestionOptionDto} from "../generated-client.ts";

export default function PlayerGame() {
    const { onMessage, send } = useWsClient();
    const [question, setQuestion] = useState<ServerSendsQuestionDto | null>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    useEffect(() => {

        // @ts-ignore
        const unsubscribe = onMessage((msg: any) => {
            // Порівнюємо з "ServerSendsQuestionDto" як рядком
            if (msg.eventType === "ServerSendsQuestionDto") {
                setQuestion(msg as ServerSendsQuestionDto);
            }
        });
        return () => unsubscribe();
    }, [onMessage]);

    const submitAnswer = () => {
        if (!question || !selectedOption) return;
        const dto: ClientAnswersQuestionDto = {
            eventType: "ClientAnswersQuestionDto", // <-- звичайний рядок
            requestId: crypto.randomUUID(),
            gameId: "game-001",
            questionId: question.questionId,
            selectedOptionId: selectedOption,
        };
        send(dto);
    };

    return (
        <div style={{ padding: "1rem" }}>
            <h1>Game Room</h1>
            {question ? (
                <div>
                    <h2>{question.questionText}</h2>
                    <ul>
                        {question.options?.map((option: QuestionOptionDto) => (
                            <li key={option.optionId}>
                                <label>
                                    <input
                                        type="radio"
                                        name="answer"
                                        value={option.optionId}
                                        onChange={() => setSelectedOption(option.optionId!)}
                                    />
                                    {option.optionText}
                                </label>
                            </li>
                        ))}
                    </ul>
                    <button onClick={submitAnswer}>Submit Answer</button>
                </div>
            ) : (
                <p>Waiting for question...</p>
            )}
        </div>
    );
}
