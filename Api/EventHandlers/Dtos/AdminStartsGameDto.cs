using WebSocketBoilerplate;

namespace Api.EventHandlers.Dtos;

public class AdminStartsGameDto : BaseDto
{
    // Давайте очікуватимемо, що фронт надішле ідентифікатор гри:
    public string GameId { get; set; } = null!;
}