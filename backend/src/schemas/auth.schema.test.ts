import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  phoneOtpRequestSchema,
  phoneOtpVerifySchema,
} from './auth.schema';

describe('registerSchema', () => {
  it('accepts a valid customer registration', () => {
    const result = registerSchema.safeParse({
      full_name: 'Nimal Perera',
      email: 'nimal@example.com',
      password: 'Password123!',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a short password', () => {
    const result = registerSchema.safeParse({
      full_name: 'Nimal Perera',
      email: 'nimal@example.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a malformed email', () => {
    const result = registerSchema.safeParse({
      full_name: 'Nimal Perera',
      email: 'not-an-email',
      password: 'Password123!',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('requires a non-empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });
});

describe('phone OTP schemas', () => {
  it('accepts an E.164 phone number', () => {
    expect(phoneOtpRequestSchema.safeParse({ phone: '+94771234567' }).success).toBe(true);
  });

  it('rejects a local-format phone number', () => {
    expect(phoneOtpRequestSchema.safeParse({ phone: '0771234567' }).success).toBe(false);
  });

  it('requires exactly a 6-digit code on verify', () => {
    expect(phoneOtpVerifySchema.safeParse({ phone: '+94771234567', token: '123456' }).success).toBe(true);
    expect(phoneOtpVerifySchema.safeParse({ phone: '+94771234567', token: '12345' }).success).toBe(false);
    expect(phoneOtpVerifySchema.safeParse({ phone: '+94771234567', token: 'abcdef' }).success).toBe(false);
  });
});
