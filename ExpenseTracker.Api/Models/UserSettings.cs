namespace ExpenseTracker.Api.Models;

public class UserSettings
{
    public int Id { get; set; }
    public decimal MonthlyIncome { get; set; }
    public decimal SavingsGoalPercent { get; set; }
    public string Currency { get; set; } = "GBP";
}
