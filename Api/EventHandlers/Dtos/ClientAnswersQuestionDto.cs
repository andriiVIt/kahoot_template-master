using WebSocketBoilerplate;

public class ClientAnswersQuestionDto : BaseDto
{
    public string GameId { get; set; } = null!;
    public string QuestionId { get; set; } = null!;
    public string SelectedOptionId { get; set; } = null!;
}