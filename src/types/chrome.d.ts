
/**
 * Type definitions for Chrome extension APIs
 * These are complementary to @types/chrome and help TypeScript 
 * recognize the Chrome extension environment
 */

interface Window {
  chrome?: typeof chrome;
}
