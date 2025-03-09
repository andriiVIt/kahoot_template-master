using WebSocketBoilerplate;
using System.Collections.Generic;

namespace Api.EventHandlers.Dtos
{
    public class ServerShowsResultsDto : BaseDto
    {
        // Подія, яку слухатимуть гравці, наприклад "ServerShowsResultsDto"
        public string eventType { get; set; } = "ServerShowsResultsDto";

        // Список результатів, де кожен - PlayerAnswerResult
        public List<PlayerAnswerResult> Results { get; set; } = new();
    }

    public class PlayerAnswerResult
    {
        public string PlayerId { get; set; } = null!;
        public string? SelectedOptionId { get; set; }
        public bool IsCorrect { get; set; }
    }
}