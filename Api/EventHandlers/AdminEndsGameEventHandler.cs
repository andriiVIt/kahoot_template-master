using System.Linq;
using System.Threading.Tasks;
using Api.EventHandlers.Dtos;
using EFScaffold;
using Microsoft.EntityFrameworkCore;
using Api.WebSockets;
using Fleck;
using WebSocketBoilerplate;

namespace Api.EventHandlers
{
    public class AdminEndsGameEventHandler(
        KahootContext context,
        IConnectionManager connectionManager
    ) : BaseEventHandler<AdminEndsGameDto>
    {
        public override async Task Handle(AdminEndsGameDto dto, IWebSocketConnection socket)
        {
            // 1. Отримуємо всіх гравців, прив'язаних до цієї гри
            var players = await context.Players
                .Where(p => p.GameId == dto.GameId)
                .ToListAsync();

            // 2. Визначаємо переможця(ів): знаходимо максимальний бал
            var maxScore = players.Max(p => p.Score ?? 0);
            var winners = players.Where(p => (p.Score ?? 0) == maxScore).ToList();

            // 3. Формуємо DTO з фінальними результатами
            var finalResults = new FinalGameResultsDto
            {
                GameId = dto.GameId,
                Players = players.Select(p => new PlayerFinalResultDto
                {
                    PlayerId = p.Id,
                    Nickname = p.Nickname,
                    Score = p.Score ?? 0
                }).ToList(),
                Winners = winners.Select(p => new PlayerFinalResultDto
                {
                    PlayerId = p.Id,
                    Nickname = p.Nickname,
                    Score = p.Score ?? 0
                }).ToList()
            };

            // 4. Розсилаємо фінальні результати всім гравцям, що підписані на топік "game-<GameId>"
            await connectionManager.BroadcastToTopic("game-" + dto.GameId, finalResults);

            // 5. Надсилаємо підтвердження адміністратору
            socket.SendDto(new ServerConfirmsDto
            {
                requestId = dto.requestId,
                Success = true
            });
        }
    }
}