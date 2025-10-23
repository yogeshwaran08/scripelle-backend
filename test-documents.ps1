# Test Document API endpoints
$baseUrl = "http://localhost:5000/api/v1"

Write-Host "Testing Document API..." -ForegroundColor Cyan

# Test 1: Create a document
Write-Host "`n--- Test 1: Create Document ---" -ForegroundColor Yellow
$body = @{
    title = "My First Document"
    content = "This is the content of my first document."
    chatHistory = @("User: Hello", "AI: Hi there!", "User: How are you?")
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/documents" -Method Post -Body $body -ContentType "application/json"
    Write-Host "Success!" -ForegroundColor Green
    Write-Host "Document ID: $($response.data.id)" -ForegroundColor White
    Write-Host "Title: $($response.data.title)" -ForegroundColor White
    Write-Host "Message: $($response.message)" -ForegroundColor Gray
    $documentId = $response.data.id
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 2: Get all documents
Write-Host "`n--- Test 2: Get All Documents ---" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/documents" -Method Get
    Write-Host "Success!" -ForegroundColor Green
    Write-Host "Total Documents: $($response.count)" -ForegroundColor White
    foreach ($doc in $response.data) {
        Write-Host "  - ID: $($doc.id) | Title: $($doc.title)" -ForegroundColor Gray
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 3: Get document by ID (if we created one)
if ($documentId) {
    Write-Host "`n--- Test 3: Get Document by ID ---" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/documents/$documentId" -Method Get
        Write-Host "Success!" -ForegroundColor Green
        Write-Host "Title: $($response.data.title)" -ForegroundColor White
        Write-Host "Content: $($response.data.content)" -ForegroundColor White
        Write-Host "Chat History Items: $($response.data.chatHistory.Count)" -ForegroundColor Gray
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
        if ($_.ErrorDetails) {
            Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }

    # Test 4: Update document
    Write-Host "`n--- Test 4: Update Document ---" -ForegroundColor Yellow
    $updateBody = @{
        title = "Updated Document Title"
        content = "This content has been updated!"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/documents/$documentId" -Method Put -Body $updateBody -ContentType "application/json"
        Write-Host "Success!" -ForegroundColor Green
        Write-Host "Updated Title: $($response.data.title)" -ForegroundColor White
        Write-Host "Updated Content: $($response.data.content)" -ForegroundColor White
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
        if ($_.ErrorDetails) {
            Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "`nDone! Server is running on $baseUrl" -ForegroundColor Cyan
Write-Host "Document endpoints:" -ForegroundColor White
Write-Host "  POST   $baseUrl/documents      - Create document" -ForegroundColor Gray
Write-Host "  GET    $baseUrl/documents      - Get all documents" -ForegroundColor Gray
Write-Host "  GET    $baseUrl/documents/:id  - Get document by ID" -ForegroundColor Gray
Write-Host "  PUT    $baseUrl/documents/:id  - Update document" -ForegroundColor Gray
Write-Host "  DELETE $baseUrl/documents/:id  - Delete document" -ForegroundColor Gray
