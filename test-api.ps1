# UniSkill Testing Script
# PowerShell script to test all endpoints

$baseUrl = "http://localhost:3001/api/v1"

Write-Host "=== UniSkill API Testing ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Register Agent
Write-Host "1. Testing Agent Registration..." -ForegroundColor Yellow
$registerBody = @{
    name = "test-agent-$(Get-Date -Format 'HHmmss')"
    description = "Automated test agent"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/agents/register" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $registerBody `
        -UseBasicParsing
    
    $agent = $response.Content | ConvertFrom-Json
    Write-Host "✓ Agent registered successfully!" -ForegroundColor Green
    Write-Host "  Wallet: $($agent.agent.wallet)" -ForegroundColor Gray
    Write-Host "  API Key: $($agent.agent.api_key)" -ForegroundColor Gray
    
    $apiKey = $agent.agent.api_key
    $wallet = $agent.agent.wallet
    
} catch {
    Write-Host "✗ Registration failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Get Swap Quote
Write-Host "2. Testing Swap Quote..." -ForegroundColor Yellow
try {
    $quoteUrl = "$baseUrl/swap/quote?inputToken=WETH&outputToken=USDC&amount=0.1"
    $response = Invoke-WebRequest -Uri $quoteUrl -UseBasicParsing
    $quote = $response.Content | ConvertFrom-Json
    
    Write-Host "✓ Quote retrieved successfully!" -ForegroundColor Green
    Write-Host "  Input: $($quote.quote.inputAmount) WETH" -ForegroundColor Gray
    Write-Host "  Output: $($quote.quote.outputAmount) USDC" -ForegroundColor Gray
    Write-Host "  Price Impact: $($quote.quote.priceImpact)%" -ForegroundColor Gray
    
} catch {
    Write-Host "✗ Quote failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test 3: Check Balance
Write-Host "3. Testing Balance Check..." -ForegroundColor Yellow
try {
    $balanceUrl = "$baseUrl/wallet/balance?wallet=$wallet"
    $response = Invoke-WebRequest -Uri $balanceUrl -UseBasicParsing
    $balance = $response.Content | ConvertFrom-Json
    
    Write-Host "✓ Balance retrieved successfully!" -ForegroundColor Green
    Write-Host "  ETH: $($balance.balances.ETH)" -ForegroundColor Gray
    
} catch {
    Write-Host "✗ Balance check failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test 4: Search Pools
Write-Host "4. Testing Pool Search..." -ForegroundColor Yellow
try {
    $poolUrl = "$baseUrl/pools/search?token0=WETH&token1=USDC"
    $response = Invoke-WebRequest -Uri $poolUrl -UseBasicParsing
    $pools = $response.Content | ConvertFrom-Json
    
    Write-Host "✓ Pools found: $($pools.count)" -ForegroundColor Green
    foreach ($pool in $pools.pools) {
        Write-Host "  Fee Tier: $($pool.feeTier) - Liquidity: $($pool.liquidity)" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "✗ Pool search failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test 5: Get Portfolio
Write-Host "5. Testing Portfolio..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/portfolio" `
        -Headers @{"x-api-key"=$apiKey} `
        -UseBasicParsing
    $portfolio = $response.Content | ConvertFrom-Json
    
    Write-Host "✓ Portfolio retrieved successfully!" -ForegroundColor Green
    Write-Host "  Agent: $($portfolio.agent.name)" -ForegroundColor Gray
    Write-Host "  ETH Balance: $($portfolio.portfolio.eth.balance)" -ForegroundColor Gray
    Write-Host "  Tokens: $($portfolio.portfolio.tokens.Count)" -ForegroundColor Gray
    Write-Host "  LP Positions: $($portfolio.portfolio.liquidityPositions.Count)" -ForegroundColor Gray
    
} catch {
    Write-Host "✗ Portfolio failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Testing Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "To fund your wallet and test swap execution:" -ForegroundColor Yellow
Write-Host "1. Get Sepolia ETH from: https://sepoliafaucet.com" -ForegroundColor Gray
Write-Host "2. Send to: $wallet" -ForegroundColor Gray
Write-Host "3. Test swap execution with your API key: $apiKey" -ForegroundColor Gray
Write-Host ""
