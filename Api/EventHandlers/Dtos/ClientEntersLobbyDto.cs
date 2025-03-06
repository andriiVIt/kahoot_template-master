using WebSocketBoilerplate;

namespace Api.EventHandlers.Dtos
{
     
    public class ClientEntersLobbyDto : BaseDto
    {
        
        public string Nickname { get; set; } = null!;
    }
}