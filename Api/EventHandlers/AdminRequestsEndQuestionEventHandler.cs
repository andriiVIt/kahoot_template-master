using Api.EventHandlers.Dtos;
using EFScaffold;
using Microsoft.EntityFrameworkCore;
using Api.WebSockets;
using Fleck;
using WebSocketBoilerplate;
using System.Threading.Tasks;

namespace Api.EventHandlers
{
    public class AdminRequestsEndQuestionEventHandler(
        KahootContext context,
        IConnectionManager connectionManager
    ) : BaseEventHandler<AdminRequestsEndQuestionDto>
    {
        public override async Task Handle(AdminRequestsEndQuestionDto dto, IWebSocketConnection socket)
        {
            // Очікуємо 15 секунд перед обчисленням результатів
            await Task.Delay(15 * 1000);

            // 1. Отримати всі відповіді на питання з БД
            var answers = await context.PlayerAnswers
                .Where(x => x.QuestionId == dto.QuestionId)
                .ToListAsync();

            // 2. Отримати варіанти для питання
            var questionOptions = await context.QuestionOptions
                .Where(o => o.QuestionId == dto.QuestionId)
                .ToListAsync();

            // 3. Визначити, які варіанти є правильними
            var correctIds = questionOptions
                .Where(o => o.IsCorrect)
                .Select(o => o.Id)
                .ToHashSet();

            // 4. Сформувати список результатів для кожного гравця
            var results = answers.Select(a => new PlayerAnswerResult
            {
                PlayerId = a.PlayerId,
                SelectedOptionId = a.SelectedOptionId,
                IsCorrect = a.SelectedOptionId != null && correctIds.Contains(a.SelectedOptionId)
            }).ToList();

            // 5. Розіслати результати всім гравцям у кімнаті гри
            await connectionManager.BroadcastToTopic("game-" + dto.GameId, new ServerShowsResultsDto
            {
                requestId = dto.requestId,
                Results = results
            });

            // 6. Позначити питання як "answered" і зберегти зміни
            var question = await context.Questions.FindAsync(dto.QuestionId);
            if (question != null)
            {
                question.Answered = true;
                await context.SaveChangesAsync();
            }

            // 7. Надіслати підтвердження адміністратору
            socket.SendDto(new ServerConfirmsDto
            {
                requestId = dto.requestId,
                Success = true
            });
        }
    }

    // DTO для передачі результатів
    public class ServerShowsResultsDto : BaseDto
    {
        public List<PlayerAnswerResult> Results { get; set; } = new();
    }

    // Результат для кожного гравця
    public class PlayerAnswerResult
    {
        public string PlayerId { get; set; } = null!;
        public string? SelectedOptionId { get; set; }
        public bool IsCorrect { get; set; }
    }
}
