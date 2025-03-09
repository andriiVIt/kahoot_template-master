using Api.EventHandlers.Dtos;
using Api.WebSockets;
using EFScaffold;
using EFScaffold.EntityFramework;
using Microsoft.EntityFrameworkCore;
using Fleck;
using WebSocketBoilerplate;

namespace Api.EventHandlers
{
    public class AdminStartsGameEventHandler(
        KahootContext context,
        IConnectionManager connectionManager
    ) : BaseEventHandler<AdminStartsGameDto>
    {
        public override async Task Handle(AdminStartsGameDto dto, IWebSocketConnection socket)
        {
            // 1. Спробуємо знайти гру з таким GameId у БД
            var existingGame = await context.Games.FindAsync(dto.GameId);
            if (existingGame == null)
            {
                existingGame = new Game
                {
                    Id = dto.GameId,
                    Name = "Kahoot " + dto.GameId
                };
                context.Games.Add(existingGame);
                await context.SaveChangesAsync();
            }

            // 2. Отримуємо всіх учасників з "lobby"
            var lobbyMembers = await connectionManager.GetMembersFromTopicId("lobby");

            // 3. Переносимо кожного учасника з "lobby" у "game-{dto.GameId}"
            foreach (var memberId in lobbyMembers)
            {
                await connectionManager.RemoveFromTopic("lobby", memberId);
                await connectionManager.AddToTopic("game-" + dto.GameId, memberId);
            }

            // 4. Оновлюємо GameId для гравців (але НЕ для адміністратора)
            foreach (var memberId in lobbyMembers)
            {
                var player = await context.Players.FindAsync(memberId);
                if (player != null && !player.Nickname.Trim().Equals("admin", StringComparison.OrdinalIgnoreCase))
                {
                    // Якщо GameId ще не встановлено
                    if (string.IsNullOrEmpty(player.GameId))
                    {
                        player.GameId = existingGame.Id;
                    }
                }
            }
            await context.SaveChangesAsync();

            // 5. Розсилаємо повідомлення, що гра почалася, всім у топіку "game-{dto.GameId}"
            await connectionManager.BroadcastToTopic(
                "game-" + dto.GameId,
                new ServerTellsPlayersGameStartedDto
                {
                    eventType = "ServerTellsPlayersGameStartedDto",
                    GameId = dto.GameId
                }
            );

            // 6. Надсилаємо підтвердження адміністратору
            socket.SendDto(new ServerConfirmsDto
            {
                requestId = dto.requestId,
                Success = true
            });
        }
    }
}
