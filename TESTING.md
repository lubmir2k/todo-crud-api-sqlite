# Testing Strategy

Comprehensive testing guide for the Todo API before deployment.

## Table of Contents

1. [Pre-Deployment Testing Checklist](#pre-deployment-testing-checklist)
2. [Local API Testing](#local-api-testing)
3. [Docker Testing](#docker-testing)
4. [Integration Testing with Flutter](#integration-testing-with-flutter)
5. [Automated Test Suite](#automated-test-suite)
6. [Performance Testing](#performance-testing)

---

## Pre-Deployment Testing Checklist

Before pushing to production, verify:

- [ ] **Build Tests**
  - [ ] Docker image builds successfully
  - [ ] No build errors or warnings
  - [ ] Image size is reasonable (<500MB)

- [ ] **API Tests**
  - [ ] All CRUD endpoints work
  - [ ] Error handling works correctly
  - [ ] CORS is configured properly
  - [ ] Invalid requests return appropriate errors

- [ ] **Integration Tests**
  - [ ] Flutter app connects to API
  - [ ] All operations work end-to-end
  - [ ] Error messages display correctly

- [ ] **Code Quality**
  - [ ] Tests pass (`npm test`)
  - [ ] No console errors
  - [ ] Clean git status

---

## Local API Testing

### 1. Stop Running Instances

First, stop any running instances to avoid port conflicts:

```bash
# Find processes using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill if needed
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### 2. Test Local API (Non-Docker)

```bash
# Start the API
npm start

# In another terminal, run tests
npm test

# Manual endpoint tests
curl http://localhost:3000/todos
curl -X POST http://localhost:3000/todos -H "Content-Type: application/json" -d '{"title":"Test"}'
```

---

## Docker Testing

### Phase 1: Build Test

```bash
# Clean up any existing containers
docker-compose down -v

# Build the image
docker-compose build

# Verify image was created
docker images | grep todo
```

**Expected output:**
```
todoapi    latest    abc123...    2 minutes ago    200MB
```

**Pass criteria:**
- ✅ Build completes without errors
- ✅ Image size < 500MB
- ✅ No security warnings

### Phase 2: Container Startup Test

```bash
# Start the container
docker-compose up -d

# Check if container is running
docker-compose ps

# View logs
docker-compose logs -f todoapi
```

**Expected output:**
```
todoapi | Server is running on http://localhost:3000
```

**Pass criteria:**
- ✅ Container status: "Up"
- ✅ No error logs
- ✅ Server starts within 10 seconds

### Phase 3: API Endpoint Tests

Run these curl commands to test each endpoint:

#### Test 1: GET all todos (empty)
```bash
curl -i http://localhost:3000/todos
```

**Expected:**
```
HTTP/1.1 200 OK
Content-Type: application/json

[]
```

#### Test 2: POST create todo
```bash
curl -i -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Docker Test Todo"}'
```

**Expected:**
```
HTTP/1.1 201 Created
Content-Type: application/json

{"id":1,"title":"Docker Test Todo","completed":0}
```

#### Test 3: GET all todos (with data)
```bash
curl -i http://localhost:3000/todos
```

**Expected:**
```
HTTP/1.1 200 OK
Content-Type: application/json

[{"id":1,"title":"Docker Test Todo","completed":0}]
```

#### Test 4: GET specific todo
```bash
curl -i http://localhost:3000/todos/1
```

**Expected:**
```
HTTP/1.1 200 OK
Content-Type: application/json

{"id":1,"title":"Docker Test Todo","completed":0}
```

#### Test 5: PUT update todo
```bash
curl -i -X PUT http://localhost:3000/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed":1}'
```

**Expected:**
```
HTTP/1.1 200 OK
Content-Type: application/json

{"id":1,"title":"Docker Test Todo","completed":1}
```

#### Test 6: DELETE todo
```bash
curl -i -X DELETE http://localhost:3000/todos/1
```

**Expected:**
```
HTTP/1.1 204 No Content
```

#### Test 7: Verify deletion
```bash
curl -i http://localhost:3000/todos
```

**Expected:**
```
HTTP/1.1 200 OK
Content-Type: application/json

[]
```

### Phase 4: Error Handling Tests

#### Test 8: Invalid ID
```bash
curl -i http://localhost:3000/todos/abc
```

**Expected:**
```
HTTP/1.1 400 Bad Request
{"error":"Invalid ID parameter"}
```

#### Test 9: Missing title
```bash
curl -i -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected:**
```
HTTP/1.1 400 Bad Request
{"error":"The \"title\" field is required and must be a non-empty string"}
```

#### Test 10: Non-existent todo
```bash
curl -i http://localhost:3000/todos/999
```

**Expected:**
```
HTTP/1.1 404 Not Found
{"error":"To-do item not found"}
```

### Phase 5: CORS Test

```bash
curl -i -X OPTIONS http://localhost:3000/todos \
  -H "Origin: http://localhost:8080" \
  -H "Access-Control-Request-Method: POST"
```

**Expected:**
```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
```

---

## Integration Testing with Flutter

### 1. Stop Local API, Keep Docker Running

```bash
# Make sure only Docker container is running
docker-compose ps
```

### 2. Verify Flutter Config

Ensure `my_todo_app/lib/config.dart` points to localhost:

```dart
static const String localUrl = 'http://localhost:3000';
static const Environment currentEnvironment = Environment.local;
```

### 3. Restart Flutter App

```bash
cd my_todo_app
flutter run -d chrome
```

### 4. Manual UI Tests

Perform these actions in the Flutter app:

- [ ] **Test 1: Load empty list**
  - Open app
  - Expected: "No todos yet" message

- [ ] **Test 2: Create todo**
  - Enter "Test Todo 1"
  - Click "Add"
  - Expected: Success message, todo appears in list

- [ ] **Test 3: Create multiple todos**
  - Add "Test Todo 2", "Test Todo 3"
  - Expected: All appear in list

- [ ] **Test 4: Toggle completion**
  - Click checkbox on first todo
  - Expected: Text strikes through, checkbox checked

- [ ] **Test 5: Delete todo**
  - Click delete icon on a todo
  - Confirm deletion
  - Expected: Todo removed from list

- [ ] **Test 6: Refresh**
  - Pull down to refresh
  - Expected: List reloads, loading indicator shows

- [ ] **Test 7: Error handling**
  - Stop Docker container: `docker-compose stop`
  - Try to add a todo
  - Expected: Red error message appears
  - Restart: `docker-compose start`

---

## Automated Test Suite

### Run Existing Tests

```bash
cd todo-crud-api-sqlite
npm test
```

### Create Comprehensive Test Script

Save as `test-all.sh` (Linux/Mac) or `test-all.bat` (Windows):

```bash
#!/bin/bash

echo "========================================="
echo "Todo API - Comprehensive Test Suite"
echo "========================================="
echo ""

API_URL="http://localhost:3000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"

    echo -n "Testing: $name... "

    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" \
            -H "Content-Type: application/json" -d "$data")
    fi

    status=$(echo "$response" | tail -n1)

    if [ "$status" == "$expected_status" ]; then
        echo -e "${GREEN}PASS${NC} (HTTP $status)"
        ((PASSED++))
    else
        echo -e "${RED}FAIL${NC} (Expected $expected_status, got $status)"
        ((FAILED++))
    fi
}

# Run tests
echo "Phase 1: Basic CRUD Operations"
echo "================================"
test_endpoint "GET empty todos" "GET" "/todos" "" "200"
test_endpoint "CREATE todo" "POST" "/todos" '{"title":"Test"}' "201"
test_endpoint "GET todos with data" "GET" "/todos" "" "200"
test_endpoint "GET specific todo" "GET" "/todos/1" "" "200"
test_endpoint "UPDATE todo" "PUT" "/todos/1" '{"completed":1}' "200"
test_endpoint "DELETE todo" "DELETE" "/todos/1" "" "204"

echo ""
echo "Phase 2: Error Handling"
echo "======================="
test_endpoint "Invalid ID format" "GET" "/todos/abc" "" "400"
test_endpoint "Missing title" "POST" "/todos" '{}' "400"
test_endpoint "Non-existent todo" "GET" "/todos/999" "" "404"

echo ""
echo "========================================="
echo "Test Results"
echo "========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "========================================="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✅${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed! ❌${NC}"
    exit 1
fi
```

**Run the script:**
```bash
chmod +x test-all.sh
./test-all.sh
```

---

## Performance Testing

### 1. Response Time Test

```bash
# Test response time
time curl -s http://localhost:3000/todos > /dev/null

# Should be < 100ms
```

### 2. Load Test (Simple)

```bash
# Create 100 todos rapidly
for i in {1..100}; do
    curl -s -X POST http://localhost:3000/todos \
        -H "Content-Type: application/json" \
        -d "{\"title\":\"Load Test $i\"}" &
done
wait

# Verify all created
curl -s http://localhost:3000/todos | grep -o "id" | wc -l
# Should show 100
```

### 3. Container Resource Usage

```bash
# Monitor resource usage
docker stats todoapi

# Should show:
# - CPU: < 5%
# - Memory: < 100MB
```

---

## Pre-Push Checklist

Before pushing to GitHub and deploying:

### Code Quality
- [ ] All tests pass: `npm test`
- [ ] No console errors in API logs
- [ ] No console errors in Flutter app
- [ ] Code is formatted and clean

### Docker
- [ ] Image builds successfully
- [ ] Container starts without errors
- [ ] All endpoint tests pass
- [ ] CORS works correctly
- [ ] Resource usage is reasonable

### Integration
- [ ] Flutter app connects to Docker API
- [ ] All CRUD operations work in UI
- [ ] Error handling works
- [ ] Loading states work

### Documentation
- [ ] README.md is up to date
- [ ] DEPLOYMENT.md is accurate
- [ ] Comments explain complex code
- [ ] Environment variables documented

### Git
- [ ] All changes committed
- [ ] Meaningful commit messages
- [ ] No sensitive data in commits
- [ ] .gitignore is correct

---

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or change Docker port in docker-compose.yml:
ports:
  - "3001:3000"  # Use 3001 locally
```

### Docker Build Fails

```bash
# Clean Docker cache
docker system prune -a

# Rebuild
docker-compose build --no-cache
```

### Container Won't Start

```bash
# Check logs
docker-compose logs

# Run interactively to see errors
docker-compose up
```

### Flutter Can't Connect

```bash
# Verify Docker is running
docker-compose ps

# Test API directly
curl http://localhost:3000/todos

# Check Flutter config
cat my_todo_app/lib/config.dart | grep localUrl
```

---

## Summary

**Recommended Testing Flow:**

1. ✅ Run local API tests (`npm test`)
2. ✅ Build Docker image (`docker-compose build`)
3. ✅ Start Docker container (`docker-compose up -d`)
4. ✅ Run automated test suite (`./test-all.sh`)
5. ✅ Test all endpoints manually with curl
6. ✅ Test Flutter integration
7. ✅ Verify all checklist items
8. ✅ Push to GitHub
9. ✅ Deploy to platform

**Estimated Time:** 15-20 minutes for complete testing

Once all tests pass, you're ready to deploy with confidence! 🚀
