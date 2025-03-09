using Api.EventHandlers.Dtos;
using EFScaffold;
using Microsoft.EntityFrameworkCore;
using Api.WebSockets;
using Fleck;
using WebSocketBoilerplate;

namespace Api.EventHandlers
{
    public class AdminRequestsEndQuestionEventHandler(
        KahootContext context,
        IConnectionManager connectionManager
    ) : BaseEventHandler<AdminRequestsEndQuestionDto>
    {
        public override async Task Handle(AdminRequestsEndQuestionDto dto, IWebSocketConnection socket)
        {
            // 1. (Опційно) Чекаємо 15 секунд перед обчисленням
            await Task.Delay(15_000);

            // 2. Знаходимо всі відповіді гравців для цього питання
            var answers = await context.PlayerAnswers
                .Where(x => x.QuestionId == dto.QuestionId)
                .ToListAsync();

            // 3. Завантажити варіанти відповіді (щоб визначити, які з них правильні)
            var questionOptions = await context.QuestionOptions
                .Where(o => o.QuestionId == dto.QuestionId)
                .ToListAsync();

            // 4. Визначити, які варіанти є правильними
            var correctIds = questionOptions
                .Where(o => o.IsCorrect)
                .Select(o => o.Id)
                .ToHashSet();

            // 5. Сформувати список результатів
            var results = answers.Select(a => new PlayerAnswerResult
            {
                PlayerId = a.PlayerId,
                SelectedOptionId = a.SelectedOptionId,
                IsCorrect = a.SelectedOptionId != null && correctIds.Contains(a.SelectedOptionId)
            }).ToList();

            // 6. Розіслати результати усім гравцям у "game-<GameId>"
            await connectionManager.BroadcastToTopic(
                "game-" + dto.GameId,
                new ServerShowsResultsDto
                {
                    requestId = dto.requestId,
                    // eventType вже = "ServerShowsResultsDto"
                    Results = results
                }
            );

            // 7. Позначити питання як Answered = true
            var question = await context.Questions.FindAsync(dto.QuestionId);
            if (question != null)
            {
                question.Answered = true;
                await context.SaveChangesAsync();
            }

            // 8. Надсилаємо підтвердження адміністратору (не обов’язково)
            socket.SendDto(new ServerConfirmsDto
            {
                requestId = dto.requestId,
                Success = true
            });
        }
    }
}
