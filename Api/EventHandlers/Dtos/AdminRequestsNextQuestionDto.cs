using WebSocketBoilerplate;

namespace Api.EventHandlers.Dtos;

public class AdminRequestsNextQuestionDto : BaseDto
{
    public string GameId { get; set; } = null!;
}