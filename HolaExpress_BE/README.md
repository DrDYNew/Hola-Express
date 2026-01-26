# Hola Express Backend

ASP.NET Core Web API backend for Hola Express application.

## Features

- ASP.NET Core 8.0
- Entity Framework Core
- SQL Server
- Swagger/OpenAPI documentation
- CORS enabled

## Getting Started

### Prerequisites

- .NET 8.0 SDK
- SQL Server

### Installation

1. Update connection string in `appsettings.json`
2. Run migrations:
   ```bash
   dotnet ef migrations add InitialCreate
   dotnet ef database update
   ```

### Run the application

```bash
dotnet run
```

The API will be available at:
- HTTP: http://localhost:5000
- HTTPS: https://localhost:5001
- Swagger: https://localhost:5001/swagger

## Project Structure

- **Controllers/** - API endpoints
- **Models/** - Database entities
- **DTOs/** - Data transfer objects
- **Services/** - Business logic
- **Interfaces/** - Service contracts
