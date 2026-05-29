namespace ExpenseTracker.Api.Models;

public class UserSettings
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public decimal MonthlyIncome { get; set; }
    public decimal SavingsGoalPercent { get; set; }
    public string Currency { get; set; } = "GBP";
}
