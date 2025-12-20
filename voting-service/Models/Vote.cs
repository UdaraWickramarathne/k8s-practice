namespace VotingService.Models
{
    public class Vote
    {
        public int Id { get; set; }
        public string Choice { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
