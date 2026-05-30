using System.Text;
using System.Text.Json;
using Amazon;
using Amazon.BedrockRuntime;
using Amazon.BedrockRuntime.Model;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
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

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = $"https://cognito-idp.eu-west-2.amazonaws.com/eu-west-2_SyAcNA1HE";
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            ValidateIssuer = true,
            ValidateLifetime = true,
            ValidateAudience = false,
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddSingleton<AmazonBedrockRuntimeClient>(
    new AmazonBedrockRuntimeClient(RegionEndpoint.EUWest2));

var app = builder.Build();

app.UseCors("AllowReact");
app.UseAuthentication();
app.UseAuthorization();
app.UseSwagger();
app.UseSwaggerUI();

string GetUserId(HttpContext ctx) =>
    ctx.User.FindFirst("sub")?.Value ?? throw new InvalidOperationException("User not authenticated");

// ── Settings ──────────────────────────────────────────────────────────────────

app.MapGet("/settings", async (HttpContext ctx, AppDbContext db) =>
{
    var userId = GetUserId(ctx);
    var settings = await db.UserSettings.FirstOrDefaultAsync(s => s.UserId == userId);
    var budgets = await db.CategoryBudgets.Include(b => b.Category).Where(b => b.UserId == userId).ToListAsync();
    return Results.Ok(new { settings, budgets });
}).RequireAuthorization();

app.MapPut("/settings", async (HttpContext ctx, UpsertSettingsDto dto, AppDbContext db) =>
{
    var userId = GetUserId(ctx);
    var settings = await db.UserSettings.FirstOrDefaultAsync(s => s.UserId == userId);
    if (settings is null)
    {
        settings = new UserSettings { UserId = userId };
        db.UserSettings.Add(settings);
    }
    settings.MonthlyIncome = dto.MonthlyIncome;
    settings.SavingsGoalPercent = dto.SavingsGoalPercent;
    settings.Currency = dto.Currency;
    await db.SaveChangesAsync();
    return Results.Ok(settings);
}).RequireAuthorization().AddEndpointFilter<ValidationFilter<UpsertSettingsDto>>();

app.MapPut("/settings/budgets/{categoryId}", async (HttpContext ctx, int categoryId, UpsertCategoryBudgetDto dto, AppDbContext db) =>
{
    var userId = GetUserId(ctx);
    var budget = await db.CategoryBudgets.FirstOrDefaultAsync(b => b.CategoryId == categoryId && b.UserId == userId);
    if (budget is null)
    {
        budget = new CategoryBudget { CategoryId = categoryId, UserId = userId };
        db.CategoryBudgets.Add(budget);
    }
    budget.MonthlyLimit = dto.MonthlyLimit;
    await db.SaveChangesAsync();
    return Results.Ok(budget);
}).RequireAuthorization().AddEndpointFilter<ValidationFilter<UpsertCategoryBudgetDto>>();

// ── Categories ────────────────────────────────────────────────────────────────

app.MapGet("/categories", async (AppDbContext db) =>
    await db.Categories.OrderBy(c => c.Name).ToListAsync())
    .RequireAuthorization();

// ── Expenses ──────────────────────────────────────────────────────────────────

app.MapGet("/expenses", async (HttpContext ctx, AppDbContext db) =>
{
    var userId = GetUserId(ctx);
    return await db.Expenses
        .Include(e => e.Category)
        .Where(e => e.UserId == userId)
        .Select(e => new {
            e.Id, e.Description, e.Amount, e.Date,
            e.CategoryId,
            CategoryName = e.Category.Name,
            CategoryIcon = e.Category.Icon
        })
        .ToListAsync();
}).RequireAuthorization();

app.MapGet("/expenses/{id}", async (HttpContext ctx, int id, AppDbContext db) =>
{
    var userId = GetUserId(ctx);
    var expense = await db.Expenses
        .Include(e => e.Category)
        .Where(e => e.Id == id && e.UserId == userId)
        .Select(e => new {
            e.Id, e.Description, e.Amount, e.Date,
            e.CategoryId,
            CategoryName = e.Category.Name,
            CategoryIcon = e.Category.Icon
        })
        .FirstOrDefaultAsync();
    return expense is not null ? Results.Ok(expense) : Results.NotFound();
}).RequireAuthorization();

app.MapPost("/expenses", async (HttpContext ctx, CreateExpenseDto dto, AppDbContext db) =>
{
    var userId = GetUserId(ctx);
    var expense = new Expense
    {
        UserId = userId,
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
}).RequireAuthorization().AddEndpointFilter<ValidationFilter<CreateExpenseDto>>();

app.MapPut("/expenses/{id}", async (HttpContext ctx, int id, UpdateExpenseDto dto, AppDbContext db) =>
{
    var userId = GetUserId(ctx);
    var expense = await db.Expenses.FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);
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
}).RequireAuthorization().AddEndpointFilter<ValidationFilter<UpdateExpenseDto>>();

app.MapDelete("/expenses/{id}", async (HttpContext ctx, int id, AppDbContext db) =>
{
    var userId = GetUserId(ctx);
    var expense = await db.Expenses.FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);
    if (expense is null) return Results.NotFound();
    db.Expenses.Remove(expense);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

// ── AI Insights ───────────────────────────────────────────────────────────────

app.MapGet("/expenses/insights", async (HttpContext ctx, AppDbContext db, AmazonBedrockRuntimeClient bedrock) =>
{
    var userId = GetUserId(ctx);

    var expenses = await db.Expenses
        .Include(e => e.Category)
        .Where(e => e.UserId == userId)
        .OrderByDescending(e => e.Date)
        .Take(50)
        .ToListAsync();

    var settings = await db.UserSettings.FirstOrDefaultAsync(s => s.UserId == userId);
    var budgets = await db.CategoryBudgets.Include(b => b.Category).Where(b => b.UserId == userId).ToListAsync();

    if (!expenses.Any())
        return Results.Ok(new { insight = "Add some expenses first and I'll analyse your spending patterns!" });

    var now = DateTime.UtcNow;
    var thisMonth = expenses.Where(e => e.Date.Month == now.Month && e.Date.Year == now.Year).ToList();
    var totalThisMonth = thisMonth.Sum(e => e.Amount);
    var categoryTotals = thisMonth.GroupBy(e => e.Category.Name)
        .Select(g => $"{g.Key}: £{g.Sum(e => e.Amount):F2}")
        .ToList();

    var prompt = $"""
        You are a friendly personal finance advisor. Analyse this user's expense data and give practical advice.

        Monthly Income: {(settings != null ? $"£{settings.MonthlyIncome:F2}" : "Not set")}
        Savings Goal: {(settings != null ? $"{settings.SavingsGoalPercent}% (£{settings.MonthlyIncome * settings.SavingsGoalPercent / 100:F2}/month)" : "Not set")}
        Total spent this month: £{totalThisMonth:F2}

        This month's spending by category:
        {string.Join("\n", categoryTotals.Any() ? categoryTotals : new List<string> { "No expenses this month yet" })}

        Category budgets:
        {string.Join("\n", budgets.Any() ? budgets.Select(b => $"{b.Category.Name}: £{b.MonthlyLimit:F2}/month") : new List<string> { "No budgets set" })}

        Recent expenses (last 10):
        {string.Join("\n", expenses.Take(10).Select(e => $"- {e.Date:dd MMM}: {e.Description} ({e.Category.Name}) £{e.Amount:F2}"))}

        Provide a concise analysis with these sections, each starting with an emoji:
        💰 Savings goal — are they on track?
        📊 Biggest spend — is it reasonable?
        💡 Two specific actionable tips to improve their finances
        ✅ One positive observation

        Rules:
        - Use plain text only, no markdown, no asterisks, no bold formatting
        - Use emojis liberally to make it engaging
        - Keep it friendly, concise and use British English
        - Max 200 words
        """;

    var body = JsonSerializer.Serialize(new
    {
        messages = new[]
        {
            new { role = "user", content = new[] { new { text = prompt } } }
        },
        inferenceConfig = new { maxTokens = 512, temperature = 0.7 }
    });

    var request = new InvokeModelRequest
    {
        ModelId = "amazon.nova-lite-v1:0",
        ContentType = "application/json",
        Accept = "application/json",
        Body = new MemoryStream(Encoding.UTF8.GetBytes(body))
    };

    var response = await bedrock.InvokeModelAsync(request);
    var json = await JsonDocument.ParseAsync(response.Body);
    var insight = json.RootElement
        .GetProperty("output")
        .GetProperty("message")
        .GetProperty("content")[0]
        .GetProperty("text")
        .GetString();

    var cleaned = insight?.Replace("**", "").Replace("##", "").Replace("# ", "");
    return Results.Ok(new { insight = cleaned });
}).RequireAuthorization();

app.Run();
