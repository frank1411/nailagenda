#!/bin/bash
DOMAIN="https://nailagenda.vercel.app"

echo "🚀 Iniciando QA Demo Test..."
echo "--------------------------------------------------"

# 1. Test Dashboard
echo -n "Testing Dashboard... "
RESPONSE=$(curl -s $DOMAIN/api/dashboard)
if [[ $RESPONSE == *"status\":\"success"* || $RESPONSE == *"totalClients"* ]]; then
  echo "✅ OK"
else
  echo "❌ FAIL: $RESPONSE"
fi

# 2. Test Clients (Filter NEW)
echo -n "Testing Clients Filter (NEW)... "
RESPONSE=$(curl -s "$DOMAIN/api/clients?status=NEW")
if [[ $RESPONSE == *"data"* ]]; then
  echo "✅ OK"
else
  echo "❌ FAIL: $RESPONSE"
fi

# 3. Test Clients (Search)
echo -n "Testing Clients Search... "
RESPONSE=$(curl -s "$DOMAIN/api/clients?search=Ana")
if [[ $RESPONSE == *"data"* ]]; then
  echo "✅ OK"
else
  echo "❌ FAIL: $RESPONSE"
fi

# 4. Test Appointments (Range)
echo -n "Testing Appointments Range... "
RESPONSE=$(curl -s "$DOMAIN/api/appointments?startDate=2024-01-01&endDate=2026-12-31")
if [[ $RESPONSE == *"data"* ]]; then
  echo "✅ OK"
else
  echo "❌ FAIL: $RESPONSE"
fi

# 5. Test Services
echo -n "Testing Services... "
RESPONSE=$(curl -s $DOMAIN/api/services)
if [[ $RESPONSE == *"data"* ]]; then
  echo "✅ OK"
else
  echo "❌ FAIL: $RESPONSE"
fi

echo "--------------------------------------------------"
echo "✅ QA Demo Test Completo."
