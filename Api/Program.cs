using System.ComponentModel.DataAnnotations;
using System.Reflection;
using Api.Documentation;
using Api.Utilities;
using Api.WebSockets;
using EFScaffold;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Scalar.AspNetCore;
using WebSocketBoilerplate;

namespace Api;

public class Program
{
    public static void Main()
    {
        var builder = WebApplication.CreateBuilder();

        // 1. Налаштування AppOptions (рядок підключення та ін.)
        builder.Services.AddOptionsWithValidateOnStart<AppOptions>()
            .Bind(builder.Configuration.GetSection(nameof(AppOptions)));

        var appOptions = builder.Services.AddAppOptions();

        // 2. Реєструємо DbContext з вашим рядком підключення
        builder.Services.AddDbContext<KahootContext>(options =>
        {
            options.UseNpgsql(appOptions.DbConnectionString);
            options.EnableSensitiveDataLogging(); // Лише для дебагу (виводить чутливі дані в лог)
        });

        // 3. Seeder для тестових даних (якщо потрібно)
        builder.Services.AddScoped<Seeder>();

        // 4. Реєструємо сервіси для WebSocket
        builder.Services.AddSingleton<IGameTimeProvider, GameTimeProvider>();
        builder.Services.AddSingleton<IConnectionManager, DictionaryConnectionManager>();
        builder.Services.AddSingleton<CustomWebSocketServer>();

        // 5. Автоматичне підключення всіх EventHandler з цього Assembly
        builder.Services.InjectEventHandlers(Assembly.GetExecutingAssembly());

        // 6. Підключаємо NSwag (OpenAPI) для генерації TypeScript-клієнта
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddOpenApiDocument(conf =>
        {
            conf.DocumentProcessors.Add(new AddAllDerivedTypesProcessor());
            conf.DocumentProcessors.Add(new AddStringConstantsProcessor());
        });
// 1. Додаємо CORS-сервіси
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowAll", policy =>
            {
                policy
                    .AllowAnyOrigin()
                    .AllowAnyMethod()
                    .AllowAnyHeader();
            });
        });

        // 7. Створюємо та налаштовуємо WebApplication
        var app = builder.Build();
        app.UseCors("AllowAll");
        // 8. Публікуємо OpenAPI (Swagger) + генеруємо TS-клієнт
        app.UseOpenApi();
        app.GenerateTypeScriptClient("/../client/src/generated-client.ts").GetAwaiter().GetResult();

        // 9. Запускаємо WebSocket-сервер
        app.Services.GetRequiredService<CustomWebSocketServer>().Start(app);

        // 10. (Опційно) Викликаємо Seeder, щоб створити тестову гру
        // Закоментуйте, якщо не потрібно
        using (var scope = app.Services.CreateScope())
        {
            var seeder = scope.ServiceProvider.GetRequiredService<Seeder>();
            var gameId = seeder.SeedDefaultGameReturnId().GetAwaiter().GetResult();
            Console.WriteLine($"Seeded default game with ID: {gameId}");
        }

        // 11. Задаємо порт для Web API (щоб не конфліктувати з портом WebSocket)
        var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
        app.Urls.Clear();
        app.Urls.Add($"http://*:{port}");

        // 12. Запускаємо додаток
        app.Run();
    }
}
