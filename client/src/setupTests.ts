// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
// Lightweight Firebase mocks so UI tests don't require real Firebase
jest.mock('firebase/auth', () => {
  return {
    onAuthStateChanged: (_auth: any, callback: (user: any) => void) => {
      callback(null);
      return () => {};
    },
    createUserWithEmailAndPassword: jest.fn().mockResolvedValue({ user: { uid: 'test-uid', email: 'test@example.com' } }),
    signInWithEmailAndPassword: jest.fn().mockResolvedValue({}),
    signOut: jest.fn().mockResolvedValue({}),
    updateProfile: jest.fn().mockResolvedValue(undefined),
  };
});

jest.mock('firebase/firestore', () => {
  return {
    doc: jest.fn(),
    setDoc: jest.fn().mockResolvedValue(undefined),
    getDoc: jest.fn().mockResolvedValue({ exists: () => false, data: () => null }),
    query: jest.fn(),
    collection: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn().mockResolvedValue({ empty: true }),
  };
});

jest.mock('firebase/storage', () => {
  return {
    ref: jest.fn(),
    uploadBytes: jest.fn().mockResolvedValue({ ref: {} }),
    getDownloadURL: jest.fn().mockResolvedValue('https://example.com/avatar.jpg'),
    deleteObject: jest.fn().mockResolvedValue(undefined),
  };
});
// Polyfills for libraries that expect Node globals in Jest/JSdom
// Fixes: ReferenceError: TextEncoder is not defined (triggered by firebase/undici)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (typeof (global as any).TextEncoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { TextEncoder, TextDecoder } = require('util');
  (global as any).TextEncoder = TextEncoder;
  (global as any).TextDecoder = TextDecoder;
}
// Some Firebase auth paths also require webcrypto in Node env
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (typeof (global as any).crypto === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { webcrypto } = require('crypto');
  (global as any).crypto = webcrypto;
}
// Polyfill Web Streams expected by undici/Firebase in Node test env
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (typeof (global as any).ReadableStream === 'undefined' || typeof (global as any).WritableStream === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const streams = require('stream/web');
  if (typeof (global as any).ReadableStream === 'undefined') {
    (global as any).ReadableStream = streams.ReadableStream;
  }
  if (typeof (global as any).WritableStream === 'undefined') {
    (global as any).WritableStream = streams.WritableStream;
  }
}
