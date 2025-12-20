using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
// Register MVC controllers so attribute-routed controllers work
builder.Services.AddControllers();
// Bind the app to specific URLs (HTTP and HTTPS)
builder.WebHost.UseUrls("http://localhost:5000","https://localhost:5001");

// Register a ConnectionMultiplexer for Redis. It will connect to the address in
// the `REDIS_CONNECTION` environment variable or fall back to localhost:6379.
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
    ConnectionMultiplexer.Connect(builder.Configuration["REDIS_CONNECTION"] ?? "localhost:6379"));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Map controller routes (attribute routing)
app.MapControllers();

app.Run();

