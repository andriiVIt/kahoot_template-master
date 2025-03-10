using Api.EventHandlers.Dtos;
using EFScaffold;
using Microsoft.EntityFrameworkCore;
using Api.WebSockets;
using Fleck;
using WebSocketBoilerplate;
using System.Linq;
using System.Threading.Tasks;

public class AdminRequestsNextQuestionEventHandler(
    KahootContext context,
    IConnectionManager connectionManager
) : BaseEventHandler<AdminRequestsNextQuestionDto>
{
    public override async Task Handle(AdminRequestsNextQuestionDto dto, IWebSocketConnection socket)
    {
        // 1. Завантажуємо гру з бази разом із питаннями та варіантами відповіді
        var game = await context.Games
            .Include(g => g.Questions)
                .ThenInclude(q => q.QuestionOptions)
            .FirstOrDefaultAsync(g => g.Id == dto.GameId);

        if (game == null)
        {
            socket.SendDto(new ServerSendsErrorMessageDto
            {
                requestId = dto.requestId,
                Error = "Game not found"
            });
            return;
        }

        // 2. Знаходимо перше питання, яке ще не відповілено (answered = false)
        var nextQuestion = game.Questions.FirstOrDefault(q => !q.Answered);
        if (nextQuestion == null)
        {
            socket.SendDto(new ServerSendsErrorMessageDto
            {
                requestId = dto.requestId,
                Error = "No more questions"
            });
            return;
        }

        // 3. Формуємо DTO для надсилання запитання гравцям
        var questionDto = new ServerSendsQuestionDto
        {
            requestId = dto.requestId,
            QuestionId = nextQuestion.Id,
            QuestionText = nextQuestion.QuestionText,
            Options = nextQuestion.QuestionOptions.Select(o => new QuestionOptionDto
            {
                OptionId = o.Id,
                OptionText = o.OptionText
            }).ToList()
            // Якщо потрібно, додайте TimeLimit, наприклад: TimeLimit = 10
        };

        // 4. Розсилаємо запитання всім гравцям, які підписані на топік "game-<GameId>"
        await connectionManager.BroadcastToTopic("game-" + dto.GameId, questionDto);

        // 5. Відзначаємо поточне питання як завершене, щоб наступного разу вибиралося інше питання
        nextQuestion.Answered = true;
        await context.SaveChangesAsync();

        // 6. Надсилаємо підтвердження адміністратору
        socket.SendDto(new ServerConfirmsDto
        {
            requestId = dto.requestId,
            Success = true
        });
    }
}

public class ServerSendsQuestionDto : BaseDto
{
    public string QuestionId { get; set; } = null!;
    public string QuestionText { get; set; } = null!;
    public List<QuestionOptionDto> Options { get; set; } = new();
}

public class QuestionOptionDto
{
    public string OptionId { get; set; } = null!;
    public string OptionText { get; set; } = null!;
}
