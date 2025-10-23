# Test Authentication with New Fields

Write-Host "Testing Registration Endpoint..." -ForegroundColor Cyan

$registerBody = @{
    email = "johnsmith@example.com"
    password = "secure123"
    firstName = "John"
    lastName = "Smith"
    plan = "premium"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest `
        -Uri "http://localhost:5000/api/v1/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerBody

    Write-Host "`nRegistration Response:" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
} catch {
    Write-Host "`nError: $_" -ForegroundColor Red
}

Write-Host "`n`nPress any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
