using Api.EventHandlers.Dtos;
using Api.WebSockets;
using EFScaffold;
using EFScaffold.EntityFramework;
using Fleck;
using WebSocketBoilerplate;

public class ClientAnswersQuestionEventHandler(
    KahootContext context,
    IConnectionManager connectionManager
) : BaseEventHandler<ClientAnswersQuestionDto>
{
    public override async Task Handle(ClientAnswersQuestionDto dto, IWebSocketConnection socket)
    {
        // 1. Отримати clientId (гравця)
        var clientId = await connectionManager.GetClientIdFromSocketId(socket.ConnectionInfo.Id.ToString());

        // 2. Знайти Player у БД (player.Id == clientId)
        //    Припустимо, що clientId = player.Id
        var player = await context.Players.FindAsync(clientId);
        if (player == null)
        {
            socket.SendDto(new ServerSendsErrorMessageDto
            {
                requestId = dto.requestId,
                Error = "Player not found in DB"
            });
            return;
        }

        // 3. Створити/оновити запис PlayerAnswer
        var existing = await context.PlayerAnswers
            .FindAsync(player.Id, dto.QuestionId);
        if (existing == null)
        {
            existing = new PlayerAnswer
            {
                PlayerId = player.Id,
                QuestionId = dto.QuestionId,
                SelectedOptionId = dto.SelectedOptionId,
                AnswerTimestamp = DateTime.UtcNow
            };
            context.PlayerAnswers.Add(existing);
        }
        else
        {
            // оновити, якщо хочете дозволити змінювати відповідь
            existing.SelectedOptionId = dto.SelectedOptionId;
            existing.AnswerTimestamp = DateTime.UtcNow;
        }

        await context.SaveChangesAsync();

        // 4. Підтвердження клієнту
        socket.SendDto(new ServerConfirmsDto
        {
            requestId = dto.requestId,
            Success = true
        });
    }
}