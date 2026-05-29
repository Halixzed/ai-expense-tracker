using System.ComponentModel.DataAnnotations;

namespace ExpenseTracker.Api.Models;

public class UpsertCategoryBudgetDto
{
    [Range(0, double.MaxValue, ErrorMessage = "Monthly limit must be 0 or more")]
    public decimal MonthlyLimit { get; set; }
}
