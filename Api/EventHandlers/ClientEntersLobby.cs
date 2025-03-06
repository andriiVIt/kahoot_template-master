using Api.EventHandlers.Dtos;
using Api.WebSockets;
using EFScaffold;
using Fleck;
using WebSocketBoilerplate;

namespace Api.EventHandlers;

// DTO, що містить список об'єктів із Id та Nickname
public class ServerPutsClientInLobbyAndBroadcastsToEveryoneDto : BaseDto
{
    public List<PlayerInfoDto> AllPlayers { get; set; } = new();
}

public class PlayerInfoDto
{
    public string Id { get; set; } = null!;
    public string Nickname { get; set; } = null!;
}

public class ClientEntersLobbyEventHandler(
    IConnectionManager connectionManager,
    KahootContext context
) : BaseEventHandler<ClientEntersLobbyDto>
{
    public override async Task Handle(ClientEntersLobbyDto dto, IWebSocketConnection socket)
    {
        // 1. Отримуємо clientId із WebSocket (за socketId).
        var clientId = await connectionManager.GetClientIdFromSocketId(socket.ConnectionInfo.Id.ToString());

        // 2. Перевіряємо, чи існує гравець у базі.
        var existingPlayer = await context.Players.FindAsync(clientId);
        if (existingPlayer == null)
        {
            // Створюємо нового гравця, якщо не існує
            var newPlayer = new EFScaffold.EntityFramework.Player
            {
                Id = clientId,
                Nickname = dto.Nickname,
                GameId = null
            };

            context.Players.Add(newPlayer);
            await context.SaveChangesAsync();
        }
        else
        {
            // Оновлюємо нікнейм, якщо потрібно
            existingPlayer.Nickname = dto.Nickname;
            await context.SaveChangesAsync();
        }

        // 3. Додаємо гравця до топіку "lobby".
        await connectionManager.AddToTopic("lobby", clientId);

        // 4. Збираємо всіх клієнтів із топіку "lobby".
        var allClientIds = await connectionManager.GetMembersFromTopicId("lobby");

        // 5. Формуємо список AllPlayers, дістаючи Nickname з бази.
        var allPlayers = new List<PlayerInfoDto>();
        foreach (var memberId in allClientIds)
        {
            var player = await context.Players.FindAsync(memberId);
            if (player != null)
            {
                allPlayers.Add(new PlayerInfoDto
                {
                    Id = player.Id,
                    Nickname = player.Nickname
                });
            }
        }

        // 6. Розсилаємо повідомлення всім у "lobby" про список гравців
        await connectionManager.BroadcastToTopic(
            "lobby",
            new ServerPutsClientInLobbyAndBroadcastsToEveryoneDto
            {
                AllPlayers = allPlayers
            }
        );

        // 7. Надсилаємо підтвердження самому гравцю
        var confirmationToClient = new ServerConfirmsDto
        {
            requestId = dto.requestId,
            Success = true
        };
        socket.SendDto(confirmationToClient);
    }
}
