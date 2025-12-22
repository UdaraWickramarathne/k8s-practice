using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddOpenApi();
builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalDev", policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod());
});
// Bind the app to all network interfaces so the service is reachable from
// the host and other containers. Avoid binding to HTTPS here because a
// developer certificate is not always available in containers or CI.
builder.WebHost.UseUrls("http://0.0.0.0:5000");

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

// Ensure routing is enabled so CORS middleware can run with endpoint routing
app.UseRouting();

// Enable CORS before HTTPS redirection so preflight requests are handled
app.UseCors("AllowLocalDev");

// Only redirect to HTTPS in production to avoid CORS preflight issues in dev
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Map controller routes (attribute routing)
app.MapControllers();

app.Run();

