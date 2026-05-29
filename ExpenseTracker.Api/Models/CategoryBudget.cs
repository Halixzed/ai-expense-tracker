namespace ExpenseTracker.Api.Models;

public class CategoryBudget
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public decimal MonthlyLimit { get; set; }
}
