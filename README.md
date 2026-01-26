# Hola Express

A mobile and web application with React Native frontend and ASP.NET Core backend.

## Project Structure

- **HolaExpress_FE/** - React Native frontend (Expo)
- **HolaExpress_BE/** - ASP.NET Core 8.0 Web API backend

## Quick Start

### Backend

```bash
cd HolaExpress_BE
dotnet restore
dotnet run
```

Backend will run on:
- HTTP: http://localhost:5000
- HTTPS: https://localhost:5001

### Frontend

```bash
cd HolaExpress_FE
npm install
npm start
```

## Documentation

See individual README files in each project folder for more details:
- [Backend README](HolaExpress_BE/README.md)
- [Frontend README](HolaExpress_FE/README.md)

## Tech Stack

### Frontend
- React Native (Expo)
- TypeScript
- Axios for API calls

### Backend
- ASP.NET Core 8.0
- Entity Framework Core
- SQL Server
- Swagger/OpenAPI
