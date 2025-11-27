import { initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";

// Initialize Firebase Admin for testing
let testApp: RulesTestEnvironment;

// Global test setup
beforeAll(async () => {
  testApp = await initializeTestEnvironment({
    projectId: 'test-project',
    firestore: {
      host: '127.0.0.1',
      port: 8080,
    },
  },);


});

afterEach(async () => {
  await testApp.clearFirestore();
});

// Global test teardown
afterAll(async () => {
  // Clean up test data
  await testApp.cleanup();
});

// Export test utilities
export { testApp };
