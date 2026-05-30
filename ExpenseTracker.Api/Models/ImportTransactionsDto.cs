namespace ExpenseTracker.Api.Models;

public class ImportTransactionsDto
{
    public List<ImportTransactionItem> Transactions { get; set; } = new();
}

public class ImportTransactionItem
{
    public string Description { get; set; } = string.Empty;
    public string? MerchantName { get; set; }
    public decimal Amount { get; set; }
    public string Category { get; set; } = "Other";
    public int MappedCategoryId { get; set; } = 10;
    public string Date { get; set; } = string.Empty;
}
