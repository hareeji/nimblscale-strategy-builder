import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import AuthPage from '../../pages/auth'

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), query: {} }),
}))

jest.mock('../../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
  },
}))

test('renders sign-in heading', () => {
  render(<AuthPage />)
  expect(screen.getByText('Sign in to NimblScale')).toBeInTheDocument()
})

test('renders email and password inputs', () => {
  render(<AuthPage />)
  expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
  expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
})

test('renders sign in and sign up buttons', () => {
  render(<AuthPage />)
  expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
})
