using WebSocketBoilerplate;

namespace Api.EventHandlers.Dtos
{
    public class ServerTellsPlayersGameStartedDto : BaseDto
    {
        // Це поле потрібне, якщо ви хочете передати gameId. 
        // Якщо не потрібно, можете видалити.
        public string GameId { get; set; } = null!;
        public string eventType { get; set; } = "ServerTellsPlayersGameStarted";
    }
}