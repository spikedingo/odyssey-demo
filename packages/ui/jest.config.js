module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|react-native-svg|lucide-react-native)',
  ],
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
};
