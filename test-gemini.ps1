# Test Gemini API endpoint
$baseUrl = "http://localhost:5000/api/v1"

Write-Host "Testing Gemini AI API..." -ForegroundColor Cyan

# Test 1: Generate text
Write-Host "`n--- Test 1: Generate Text ---" -ForegroundColor Yellow
$body = @{
    prompt = "Say hello in 3 different languages"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/ai/generate-text" -Method Post -Body $body -ContentType "application/json"
    Write-Host "Success!" -ForegroundColor Green
    Write-Host "Response: $($response.text)" -ForegroundColor White
    Write-Host "Model: $($response.model)" -ForegroundColor Gray
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host "`nDone!" -ForegroundColor Cyan
