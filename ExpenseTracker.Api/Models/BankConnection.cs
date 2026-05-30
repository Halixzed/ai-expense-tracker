namespace ExpenseTracker.Api.Models;

public class BankConnection
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime ConnectedAt { get; set; }
}
