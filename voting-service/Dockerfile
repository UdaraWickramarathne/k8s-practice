FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# copy csproj and restore as a distinct layer
COPY ./voting-service.csproj ./
RUN dotnet restore ./voting-service.csproj

# copy everything else and publish
COPY . ./
RUN dotnet publish ./voting-service.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:5000

COPY --from=build /app/publish .

EXPOSE 5000

ENTRYPOINT ["dotnet", "voting-service.dll"]
