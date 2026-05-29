using System.ComponentModel.DataAnnotations;

namespace ExpenseTracker.Api.Models;

public class UpdateExpenseDto
{
    [Required]
    [StringLength(200, MinimumLength = 1, ErrorMessage = "Description must be between 1 and 200 characters")]
    public string Description { get; set; } = string.Empty;

    [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
    public decimal Amount { get; set; }

    [Required]
    [StringLength(100, MinimumLength = 1, ErrorMessage = "Category must be between 1 and 100 characters")]
    public string Category { get; set; } = string.Empty;

    [Required]
    public DateTime Date { get; set; }
}
