// setupTests.ts
import '@testing-library/jest-dom';
// Stub Firebase config to avoid real initialization during tests
jest.mock('./firebaseConfig', () => {
  const dummy: any = {};
  return { auth: dummy, db: dummy, storage: dummy, default: dummy };
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('shows auth UI by default', () => {
  render(<App />);
  expect(screen.getByText(/welcome back!/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
});
