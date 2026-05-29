using Microsoft.EntityFrameworkCore;
using ExpenseTracker.Api.Models;

namespace ExpenseTracker.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Expense> Expenses { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<UserSettings> UserSettings { get; set; }
    public DbSet<CategoryBudget> CategoryBudgets { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Expense>()
            .Property(e => e.Amount)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Expense>()
            .HasOne(e => e.Category)
            .WithMany()
            .HasForeignKey(e => e.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Expense>()
            .Property(e => e.CategoryId)
            .HasDefaultValue(10);

        modelBuilder.Entity<UserSettings>()
            .Property(s => s.MonthlyIncome)
            .HasPrecision(18, 2);

        modelBuilder.Entity<UserSettings>()
            .Property(s => s.SavingsGoalPercent)
            .HasPrecision(5, 2);

        modelBuilder.Entity<CategoryBudget>()
            .Property(b => b.MonthlyLimit)
            .HasPrecision(18, 2);

        modelBuilder.Entity<CategoryBudget>()
            .HasOne(b => b.Category)
            .WithMany()
            .HasForeignKey(b => b.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserSettings>().HasData(
            new UserSettings { Id = 1, MonthlyIncome = 0, SavingsGoalPercent = 20, Currency = "GBP" }
        );

        modelBuilder.Entity<Category>().HasData(
            new Category { Id = 1,  Name = "Food & Dining",  Icon = "Utensils"     },
            new Category { Id = 2,  Name = "Transport",      Icon = "Car"          },
            new Category { Id = 3,  Name = "Entertainment",  Icon = "Tv"           },
            new Category { Id = 4,  Name = "Shopping",       Icon = "ShoppingBag"  },
            new Category { Id = 5,  Name = "Health",         Icon = "Heart"        },
            new Category { Id = 6,  Name = "Housing",        Icon = "Home"         },
            new Category { Id = 7,  Name = "Utilities",      Icon = "Zap"          },
            new Category { Id = 8,  Name = "Education",      Icon = "BookOpen"     },
            new Category { Id = 9,  Name = "Travel",         Icon = "Plane"        },
            new Category { Id = 10, Name = "Other",          Icon = "Package"      }
        );
    }
}
