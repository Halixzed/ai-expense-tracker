# FinTrack 💰

> AI-powered personal finance tracker with Open Banking integration, built on a modern cloud-native stack.

![Tech Stack](https://img.shields.io/badge/ASP.NET_Core-9.0-512BD4?style=flat-square&logo=dotnet)
![React](https://img.shields.io/badge/React-TypeScript-61DAFB?style=flat-square&logo=react)
![AWS](https://img.shields.io/badge/AWS-App_Runner_·_Bedrock_·_Cognito-FF9900?style=flat-square&logo=amazonaws)
![Azure](https://img.shields.io/badge/Azure-SQL-0078D4?style=flat-square&logo=microsoftazure)
![Terraform](https://img.shields.io/badge/IaC-Terraform-7B42BC?style=flat-square&logo=terraform)

---

## What is FinTrack?

FinTrack is a full-stack cloud-native finance application that lets users track spending, set budgets, connect their bank account via Open Banking, and get AI-generated spending insights — all secured with Google Single Sign-On.

---

## Features

| Feature | Description |
|---|---|
| **Expense Tracking** | Add, edit and delete expenses with predefined categories and icons |
| **Smart Budgets** | Set monthly income, savings goals and per-category budget limits |
| **Live Dashboards** | Radial gauges, budget bar charts and all-time donut chart powered by Recharts |
| **Open Banking** | Connect your bank via TrueLayer, fetch real transactions and auto-import them |
| **AI Categorisation** | Amazon Nova Lite automatically categorises imported bank transactions |
| **AI Insights** | Get personalised spending analysis and actionable tips powered by AWS Bedrock |
| **Google SSO** | Secure authentication via AWS Cognito and Google OAuth — per-user data isolation |
| **Fully Responsive** | Works on mobile and desktop |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Frontend                         │
│         React + TypeScript + Tailwind + Recharts        │
│              AWS S3 + CloudFront (CDN)                  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────┐
│                      Backend API                        │
│           ASP.NET Core 9 · Minimal APIs                 │
│               AWS App Runner (Docker)                   │
└────┬─────────────┬──────────────┬───────────────────────┘
     │             │              │
┌────▼────┐  ┌────▼─────┐  ┌────▼────────┐
│ Azure   │  │  AWS     │  │  TrueLayer  │
│  SQL    │  │ Bedrock  │  │ Open Banking│
│         │  │Nova Lite │  │  (Sandbox)  │
└─────────┘  └──────────┘  └─────────────┘
```

---

## Tech Stack

### Backend
- **ASP.NET Core 9** — Minimal APIs, JWT Bearer Auth, EF Core 9
- **Azure SQL** — Relational database via Entity Framework Core
- **Docker** — Containerised and pushed to AWS ECR

### Frontend
- **React 18 + TypeScript** — Component-based UI
- **Tailwind CSS v4** — Neo-brutalist design system
- **Recharts** — Radial gauges, bar charts, donut charts
- **AWS Amplify** — Cognito auth integration

### Cloud & Infrastructure
- **AWS App Runner** — Serverless container hosting
- **AWS S3 + CloudFront** — Static frontend hosting with global CDN
- **AWS Cognito** — User pool with Google SSO
- **AWS Bedrock (Nova Lite)** — AI spending insights and transaction categorisation
- **AWS ECR** — Docker image registry
- **Azure SQL** — Managed relational database
- **Terraform** — All infrastructure defined as code

### DevOps
- **GitHub Actions** — CI/CD pipelines for API and frontend
  - Push to `main` → Docker build → ECR push → App Runner auto-deploys
  - Push to `main` → React build → S3 deploy → CloudFront invalidation

### Integrations
- **TrueLayer** — Open Banking OAuth 2.0, transaction fetching and AI-powered import
- **Google OAuth** — SSO via AWS Cognito Identity Provider

---

## Project Structure

```
NetDev/
├── ExpenseTracker.Api/          # ASP.NET Core backend
│   ├── Data/                    # EF Core DbContext
│   ├── Filters/                 # Validation endpoint filters
│   ├── Migrations/              # EF Core migrations
│   ├── Models/                  # Domain models + DTOs
│   ├── Dockerfile
│   └── Program.cs               # Minimal API endpoints
├── expense-tracker-ui/          # React frontend
│   ├── src/
│   │   ├── App.tsx              # Main application component
│   │   ├── auth.ts              # AWS Amplify auth helpers
│   │   └── main.tsx             # Amplify config + entry point
│   └── public/
├── terraform/                   # Infrastructure as Code
│   ├── main.tf                  # Provider config
│   ├── apprunner.tf             # App Runner service
│   ├── cognito.tf               # User pool + Google IDP
│   ├── ecr.tf                   # Container registry
│   ├── frontend.tf              # S3 + CloudFront
│   ├── bedrock.tf               # IAM for Bedrock access
│   └── outputs.tf
└── .github/
    └── workflows/
        ├── api.yml              # API CI/CD pipeline
        └── frontend.yml         # Frontend CI/CD pipeline
```

---

## Getting Started

### Prerequisites
- .NET 9 SDK
- Node.js 18+
- Docker Desktop
- AWS CLI (configured)
- Azure CLI (configured)
- Terraform

### Local Development

**1. Clone the repo**
```bash
git clone https://github.com/Halixzed/ai-expense-tracker.git
cd ai-expense-tracker
```

**2. Start the API**
```bash
cd ExpenseTracker.Api
dotnet run
```

**3. Start the frontend**
```bash
cd expense-tracker-ui
cp .env.example .env        # set VITE_API_URL=http://localhost:5106
npm install
npm run dev
```

**4. Open** `http://localhost:5173`

---

## CI/CD

Every push to `main` triggers:

```
git push → GitHub Actions
              ├── API workflow    → Docker build → ECR → App Runner
              └── Frontend workflow → npm build → S3 → CloudFront
```

No manual deployments needed.

---

## Infrastructure

All cloud resources are managed with Terraform:

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

Resources provisioned: App Runner, ECR, S3, CloudFront, Cognito User Pool, IAM roles, Bedrock policy.

---

## Key Design Decisions

- **Multi-cloud** — Azure SQL for the database (Azure expertise) + AWS for compute and AI (AWS ecosystem). Demonstrates cross-cloud architecture.
- **Minimal APIs** — Chosen over controllers for simplicity and performance in a microservice-style backend.
- **Per-user data isolation** — All database queries are scoped to the authenticated user's `sub` claim from the Cognito JWT.
- **AI as a feature, not a gimmick** — Bedrock is used for two real tasks: transaction categorisation and spending insights, both backed by real user data.
- **Infrastructure as Code from day one** — Terraform manages all resources, making the infrastructure reproducible and auditable.

---

## Roadmap

- [ ] Stripe integration — Free vs Premium subscription tiers
- [ ] TrueLayer production environment — Real bank connections
- [ ] Export to CSV
- [ ] Monthly spending reports via email
- [ ] Mobile app (React Native)

---

*Built as a learning project to demonstrate full-stack cloud-native development with .NET, React, AWS, and AI integration.*
