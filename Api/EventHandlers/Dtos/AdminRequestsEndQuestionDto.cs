using WebSocketBoilerplate;

namespace Api.EventHandlers.Dtos
{
    public class AdminRequestsEndQuestionDto : BaseDto
    {
        public string GameId { get; set; } = null!;
        public string QuestionId { get; set; } = null!;
        // Ми не додаємо Duration, адже завжди використовуємо 15 секунд
    }
}