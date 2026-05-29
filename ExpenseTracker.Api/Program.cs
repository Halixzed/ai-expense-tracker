using Microsoft.EntityFrameworkCore;
using ExpenseTracker.Api.Data;
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

// GET all expenses
app.MapGet("/expenses", async (AppDbContext db) =>
    await db.Expenses.ToListAsync());

// GET single expense
app.MapGet("/expenses/{id}", async (int id, AppDbContext db) =>
    await db.Expenses.FindAsync(id) is Expense expense
        ? Results.Ok(expense)
        : Results.NotFound());

// POST create expense
app.MapPost("/expenses", async (CreateExpenseDto dto, AppDbContext db) =>
{
    var expense = new Expense
    {
        Description = dto.Description,
        Amount = dto.Amount,
        Category = dto.Category,
        Date = dto.Date
    };
    db.Expenses.Add(expense);
    await db.SaveChangesAsync();
    return Results.Created($"/expenses/{expense.Id}", expense);
});

// PUT update expense
app.MapPut("/expenses/{id}", async (int id, Expense updated, AppDbContext db) =>
{
    var expense = await db.Expenses.FindAsync(id);
    if (expense is null) return Results.NotFound();

    expense.Description = updated.Description;
    expense.Amount = updated.Amount;
    expense.Category = updated.Category;
    expense.Date = updated.Date;

    await db.SaveChangesAsync();
    return Results.Ok(expense);
});

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
