using System.ComponentModel.DataAnnotations;

namespace ExpenseTracker.Api.Models;

public class UpsertSettingsDto
{
    [Range(0, double.MaxValue, ErrorMessage = "Monthly income must be 0 or more")]
    public decimal MonthlyIncome { get; set; }

    [Range(0, 100, ErrorMessage = "Savings goal must be between 0 and 100")]
    public decimal SavingsGoalPercent { get; set; }

    [Required]
    [StringLength(3, MinimumLength = 3, ErrorMessage = "Currency must be a 3-letter code")]
    public string Currency { get; set; } = "GBP";
}
