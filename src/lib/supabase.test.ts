/* eslint-disable @typescript-eslint/no-require-imports */

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({})),
}));

describe('supabase client', () => {
  const originalEnv = process.env;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleWarnSpy.mockRestore();
  });

  it('should initialize with valid env variables', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid_key';

    require('./supabase');
    const { createClient } = require('@supabase/supabase-js');

    expect(createClient).toHaveBeenCalledWith('http://localhost:54321', 'valid_key');
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should fall back to NEXT_PUBLIC_SUPABASE_ANON_KEY if service role key is missing', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon_key';

    require('./supabase');
    const { createClient } = require('@supabase/supabase-js');

    expect(createClient).toHaveBeenCalledWith('http://localhost:54321', 'anon_key');
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should warn if supabase keys are missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    require('./supabase');
    const { createClient } = require('@supabase/supabase-js');

    expect(createClient).toHaveBeenCalledWith('https://placeholder.supabase.co', 'placeholder_key');
    expect(consoleWarnSpy).toHaveBeenCalledWith('Supabase URL or Key is missing. Check your .env.local file.');
  });
});
