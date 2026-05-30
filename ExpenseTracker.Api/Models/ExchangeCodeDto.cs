using System.ComponentModel.DataAnnotations;

namespace ExpenseTracker.Api.Models;

public class ExchangeCodeDto
{
    [Required]
    public string Code { get; set; } = string.Empty;

    [Required]
    public string RedirectUri { get; set; } = string.Empty;
}
