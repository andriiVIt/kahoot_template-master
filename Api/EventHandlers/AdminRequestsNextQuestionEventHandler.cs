using Api.EventHandlers.Dtos;
using EFScaffold;
using Microsoft.EntityFrameworkCore;
using Api.WebSockets;
using Fleck;
using WebSocketBoilerplate;

public class AdminRequestsNextQuestionEventHandler(
    KahootContext context,
    IConnectionManager connectionManager
) : BaseEventHandler<AdminRequestsNextQuestionDto>
{
    public override async Task Handle(AdminRequestsNextQuestionDto dto, IWebSocketConnection socket)
    {
        // 1. Завантажити гру з бази
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

        // 2. Знайти наступне unanswered питання
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

        // 3. Відправити питання всім у "game-<GameId>"
        await connectionManager.BroadcastToTopic("game-" + dto.GameId, new ServerSendsQuestionDto
        {
            requestId = dto.requestId,
            QuestionId = nextQuestion.Id,
            QuestionText = nextQuestion.QuestionText,
            Options = nextQuestion.QuestionOptions.Select(o => new QuestionOptionDto
            {
                OptionId = o.Id,
                OptionText = o.OptionText
            }).ToList()
        });

        // 4. Підтвердження адміністратору (необов’язково)
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
