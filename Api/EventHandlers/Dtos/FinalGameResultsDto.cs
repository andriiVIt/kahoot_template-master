using WebSocketBoilerplate;
using System.Collections.Generic;

namespace Api.EventHandlers.Dtos
{
    public class AdminEndsGameDto : BaseDto
    {
        public string GameId { get; set; } = null!;
    }

    public class FinalGameResultsDto : BaseDto
    {
        public string GameId { get; set; } = null!;
        public List<PlayerFinalResultDto> Players { get; set; } = new();
        public List<PlayerFinalResultDto> Winners { get; set; } = new();
        public string eventType { get; set; } = "FinalGameResultsDto";
    }

    public class PlayerFinalResultDto
    {
        public string PlayerId { get; set; } = null!;
        public string Nickname { get; set; } = null!;
        public int Score { get; set; }
    }
}