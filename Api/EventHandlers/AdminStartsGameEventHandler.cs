using Api.EventHandlers.Dtos;
using Api.WebSockets;
using Fleck;
using WebSocketBoilerplate;

namespace Api.EventHandlers
{
    public class AdminStartsGameEventHandler(IConnectionManager connectionManager) 
        : BaseEventHandler<AdminStartsGameDto>
    {
        public override async Task Handle(AdminStartsGameDto dto, IWebSocketConnection socket)
        {
            // 1. Беремо список всіх у "lobby"
            var lobbyMembers = await connectionManager.GetMembersFromTopicId("lobby");

            // 2. Переносимо кожного у "game-" + dto.GameId
            foreach (var memberId in lobbyMembers)
            {
                await connectionManager.RemoveFromTopic("lobby", memberId);
                await connectionManager.AddToTopic("game-" + dto.GameId, memberId);
            }

            // 3. Розсилаємо "ServerTellsPlayersGameStartedDto" усім у "game-{dto.GameId}"
            // Тепер client-side зможе слухати "ServerTellsPlayersGameStarted" як подію
            await connectionManager.BroadcastToTopic(
                "game-" + dto.GameId,
                new ServerTellsPlayersGameStartedDto
                {
                    GameId = dto.GameId,
                    // eventType тут уже прописано в самому DTO через override
                }
            );

            // 4. Підтвердження адмінові
            socket.SendDto(new ServerConfirmsDto
            {
                requestId = dto.requestId,
                Success = true
            });
        }
    }
}