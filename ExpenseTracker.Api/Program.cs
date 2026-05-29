using Microsoft.EntityFrameworkCore;
using ExpenseTracker.Api.Data;
using ExpenseTracker.Api.Filters;
using ExpenseTracker.Api.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
        policy.WithOrigins("http://localhost:5173", "https://d21zqbe3j8g9m5.cloudfront.net")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

app.UseCors("AllowReact");
app.UseSwagger();
app.UseSwaggerUI();

// GET settings
app.MapGet("/settings", async (AppDbContext db) =>
{
    var settings = await db.UserSettings.FirstOrDefaultAsync();
    var budgets = await db.CategoryBudgets.Include(b => b.Category).ToListAsync();
    return Results.Ok(new { settings, budgets });
});

// PUT settings
app.MapPut("/settings", async (UpsertSettingsDto dto, AppDbContext db) =>
{
    var settings = await db.UserSettings.FirstOrDefaultAsync();
    if (settings is null)
    {
        settings = new UserSettings();
        db.UserSettings.Add(settings);
    }
    settings.MonthlyIncome = dto.MonthlyIncome;
    settings.SavingsGoalPercent = dto.SavingsGoalPercent;
    settings.Currency = dto.Currency;
    await db.SaveChangesAsync();
    return Results.Ok(settings);
}).AddEndpointFilter<ValidationFilter<UpsertSettingsDto>>();

// PUT category budget
app.MapPut("/settings/budgets/{categoryId}", async (int categoryId, UpsertCategoryBudgetDto dto, AppDbContext db) =>
{
    var budget = await db.CategoryBudgets.FirstOrDefaultAsync(b => b.CategoryId == categoryId);
    if (budget is null)
    {
        budget = new CategoryBudget { CategoryId = categoryId };
        db.CategoryBudgets.Add(budget);
    }
    budget.MonthlyLimit = dto.MonthlyLimit;
    await db.SaveChangesAsync();
    return Results.Ok(budget);
}).AddEndpointFilter<ValidationFilter<UpsertCategoryBudgetDto>>();

// GET all categories
app.MapGet("/categories", async (AppDbContext db) =>
    await db.Categories.OrderBy(c => c.Name).ToListAsync());

// GET all expenses
app.MapGet("/expenses", async (AppDbContext db) =>
    await db.Expenses
        .Include(e => e.Category)
        .Select(e => new {
            e.Id, e.Description, e.Amount, e.Date,
            e.CategoryId,
            CategoryName = e.Category.Name,
            CategoryIcon = e.Category.Icon
        })
        .ToListAsync());

// GET single expense
app.MapGet("/expenses/{id}", async (int id, AppDbContext db) =>
{
    var expense = await db.Expenses
        .Include(e => e.Category)
        .Where(e => e.Id == id)
        .Select(e => new {
            e.Id, e.Description, e.Amount, e.Date,
            e.CategoryId,
            CategoryName = e.Category.Name,
            CategoryIcon = e.Category.Icon
        })
        .FirstOrDefaultAsync();

    return expense is not null ? Results.Ok(expense) : Results.NotFound();
});

// POST create expense
app.MapPost("/expenses", async (CreateExpenseDto dto, AppDbContext db) =>
{
    var expense = new Expense
    {
        Description = dto.Description,
        Amount = dto.Amount,
        CategoryId = dto.CategoryId,
        Date = dto.Date
    };
    db.Expenses.Add(expense);
    await db.SaveChangesAsync();

    await db.Entry(expense).Reference(e => e.Category).LoadAsync();

    return Results.Created($"/expenses/{expense.Id}", new {
        expense.Id, expense.Description, expense.Amount, expense.Date,
        expense.CategoryId,
        CategoryName = expense.Category.Name,
        CategoryIcon = expense.Category.Icon
    });
}).AddEndpointFilter<ValidationFilter<CreateExpenseDto>>();

// PUT update expense
app.MapPut("/expenses/{id}", async (int id, UpdateExpenseDto dto, AppDbContext db) =>
{
    var expense = await db.Expenses.FindAsync(id);
    if (expense is null) return Results.NotFound();

    expense.Description = dto.Description;
    expense.Amount = dto.Amount;
    expense.CategoryId = dto.CategoryId;
    expense.Date = dto.Date;

    await db.SaveChangesAsync();
    await db.Entry(expense).Reference(e => e.Category).LoadAsync();

    return Results.Ok(new {
        expense.Id, expense.Description, expense.Amount, expense.Date,
        expense.CategoryId,
        CategoryName = expense.Category.Name,
        CategoryIcon = expense.Category.Icon
    });
}).AddEndpointFilter<ValidationFilter<UpdateExpenseDto>>();

// DELETE expense
app.MapDelete("/expenses/{id}", async (int id, AppDbContext db) =>
{
    var expense = await db.Expenses.FindAsync(id);
    if (expense is null) return Results.NotFound();

    db.Expenses.Remove(expense);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.Run();
