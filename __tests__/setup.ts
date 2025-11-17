import fs from 'fs';
import path from 'path';

// Clean up test database after all tests
afterAll(() => {
  const testDbPath = path.join(process.cwd(), 'insurance.test.db');
  if (fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath);
    } catch (err) {
      // Ignore errors during cleanup
    }
  }
});
