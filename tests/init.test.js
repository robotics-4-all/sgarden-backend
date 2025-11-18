import http from "node:http";

import test from "ava";
import got from "got";

import app from "../server.js";

// ========================================
// BASIC TESTS
// ========================================

test("Test passes", (t) => {
	t.pass();
});

// test("Test fails", (t) => {
// 	t.fail();
// });

test("Test throws", (t) => {
    t.throws(() => {
	    throw new Error("Test failed");
    });
});

const addNumbers = (a,b) => a + b;

test('Add numbers', t => {
    t.is(addNumbers(1,2), 3);
    t.is(addNumbers(3,5), 8);
    t.is(addNumbers(-1,2), 1);
    t.is(addNumbers(0,0), 0);
    t.is(addNumbers(0,2), 2);
    t.is(addNumbers("1", "2"), "12");
    t.is(addNumbers("1", 2), "12");
    t.is(addNumbers(undefined, 2), NaN);
    t.is(addNumbers(), NaN);
});

test('Async test', async t => {
    const res = Promise.resolve('test');
    t.is(await res, 'test');
});


// ========================================
// HTTP ENDPOINT TESTS
// ========================================

// Setup: Create server before tests run
test.before(async (t) => {
	t.context.server = http.createServer(app);
    const server = t.context.server.listen();
    const { port } = server.address();
	t.context.got = got.extend({ responseType: "json", prefixUrl: `http://localhost:${port}` });
});

// Teardown: Close server after all tests complete
test.after.always((t) => {
	t.context.server.close();
});


// ========================================
// Test 1: Basic GET request
// ========================================
test("GET /api returns correct response and status code", async (t) => {
	const { body, statusCode } = await t.context.got("api");
	t.is(body.message, "It works!");
	t.is(statusCode, 200);
});


// ========================================
// Test 2: Response headers validation
// ========================================
// test("GET /api returns JSON content-type header", async (t) => {
// 	const response = await t.context.got("api");
// 	t.true(response.headers["content-type"].includes("application/json"));
// });

// ========================================
// Test 3: Multiple assertions with t.plan()
// ========================================
test("GET /api comprehensive validation", async (t) => {
	// t.plan ensures all 3 assertions are executed
	t.plan(3);
	
	const { body, statusCode, headers } = await t.context.got("api");
	
	t.is(statusCode, 200);
	t.is(body.message, "It works!");
	t.truthy(headers["content-type"]);
});

// ========================================
// Test 4: Response body structure validation
// ========================================
test("GET /api response has expected structure", async (t) => {
	const { body } = await t.context.got("api");
	
	// Check that body is an object
	t.is(typeof body, "object");
	
	// Check that 'message' property exists
	t.true("message" in body);
	
	// Check that 'message' is a string
	t.is(typeof body.message, "string");
	
	// Check that message is not empty
	t.true(body.message.length > 0);
});



// ========================================
// Test 5: Testing error responses
// ========================================
// test("GET /api/nonexistent returns 404", async (t) => {
// 	// When making a request to a non-existent endpoint, got throws an error
// 	const error = await t.throwsAsync(
// 		async () => await t.context.got("api/nonexistent"),
// 		{ instanceOf: got.HTTPError }
// 	);
	
// 	// Check the status code in the error response
// 	t.is(error.response.statusCode, 404);
// });


// ========================================
// Test 6: Testing with query parameters
// ========================================
// test("GET /api with query parameters", async (t) => {
// 	const { body, statusCode } = await t.context.got("api", {
// 		searchParams: { test: "value", another: "param" }
// 	});
	
// 	// The endpoint should still work with query params
// 	t.is(statusCode, 200);
// 	t.truthy(body);
// });


// ========================================
// Test 7: Response timing validation
// ========================================
test("GET /api responds within reasonable time", async (t) => {
	const startTime = Date.now();
	await t.context.got("api");
	const endTime = Date.now();
	
	const responseTime = endTime - startTime;
	
	// Response should be under 1000ms (1 second)
	t.true(responseTime < 1000, `Response time ${responseTime}ms exceeds 1000ms`);
});


// ========================================
// Test 8: Testing response serialization
// ========================================
// test("GET /api response is valid JSON", async (t) => {
// 	const response = await t.context.got("api", {
// 		responseType: "text"
// 	});
	
// 	// Should not throw when parsing JSON
// 	t.notThrows(() => JSON.parse(response.body));
	
// 	const parsed = JSON.parse(response.body);
// 	t.is(typeof parsed, "object");
// });


// ========================================
// Test 9: Testing with custom headers
// ========================================
// test("GET /api with custom headers", async (t) => {
// 	const { body, statusCode } = await t.context.got("api", {
// 		headers: {
// 			"User-Agent": "AVA-Test-Client",
// 			"X-Custom-Header": "test-value"
// 		}
// 	});
	
// 	t.is(statusCode, 200);
// 	t.is(body.message, "It works!");
// });


// ========================================
// Test 10: Testing concurrent requests
// ========================================
test("API handles multiple concurrent requests", async (t) => {
	// Make 5 requests simultaneously

	let requests = [];

	for (let i = 0; i < 5; i++) {
		requests.push(t.context.got("api"));
	}

	// Question, how can i make them serial instead of parallel?
	
	const responses = await Promise.all(requests);
	
	// All should succeed
	t.is(responses.length, 5);
	responses.forEach(response => {
		t.is(response.statusCode, 200);
		t.is(response.body.message, "It works!");
	});
});


// ========================================
// Test 11: Testing response consistency
// ========================================
// test("GET /api returns consistent response", async (t) => {
// 	const response1 = await t.context.got("api");
// 	const response2 = await t.context.got("api");
	
// 	// Multiple calls should return the same result
// 	t.deepEqual(response1.body, response2.body);
// 	t.is(response1.statusCode, response2.statusCode);
// });


// ========================================
// Test 12: Testing POST request with authentication endpoint
// ========================================
test("POST /api/authenticate with invalid credentials returns error", async (t) => {
	// Test a real POST endpoint: user login with invalid credentials
	// This route doesn't require authentication and works without database
	const { body } = await t.context.got.post("api/authenticate", {
		json: { 
			username: "nonexistentuser", 
			password: "wrongpassword" 
		},
		throwHttpErrors: true
	});
	
	// Should indicate user not found
	t.is(body.success, false);
	t.is(body.status, 500);
	
	// Should have an error message
	t.truthy(body.message);
	t.true(body.message.includes("Authentication Error"));
});

// Truthy: Value passes if it is not false, 0, "", null, undefined, or NaN.
// True: Value passes only if it is exactly true (strict boolean check).
test('Truthy vs truth', (t) => {
	t.truthy(1);
	t.truthy('Not an empty string');
	t.true(true);
})