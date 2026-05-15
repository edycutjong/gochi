import { POST } from './route';
import { supabase } from '@/lib/supabase';
import { is0GConfigured, kvWrite } from '@/lib/zero-g';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('@/lib/zero-g', () => ({
  is0GConfigured: jest.fn(),
  kvWrite: jest.fn(),
}));

describe('POST /api/kv/write', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (is0GConfigured as jest.Mock).mockReturnValue(false);
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should return 400 if key or value is missing', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ key: 'test' }), // missing value
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Key and value are required');
  });

  it('should successfully write to KV storage', async () => {
    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ upsert: mockUpsert });

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ key: 'test', value: 'val' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.txHash).toBeDefined();
    expect(typeof data.latency).toBe('number');
  });

  it('should return 500 if supabase error occurs', async () => {
    const mockUpsert = jest.fn().mockResolvedValue({ error: new Error('DB error') });
    (supabase.from as jest.Mock).mockReturnValue({ upsert: mockUpsert });

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ key: 'test', value: 'val' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to write to KV Storage');
    expect(data.details).toBe('DB error');
  });

  it('should return 500 if non-Error is thrown', async () => {
    const mockUpsert = jest.fn().mockResolvedValue({ error: 'String error' });
    (supabase.from as jest.Mock).mockReturnValue({ upsert: mockUpsert });

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ key: 'test', value: 'val' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to write to KV Storage');
    expect(data.details).toBe('Unknown error');
  });

  it('should successfully write to 0G storage', async () => {
    (is0GConfigured as jest.Mock).mockReturnValue(true);
    (kvWrite as jest.Mock).mockResolvedValue({ txHash: '0xabc', rootHash: '0xdef' });

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ key: 'test', value: 'val' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.source).toBe('zerog');
    expect(data.txHash).toBe('0xabc');
    expect(data.rootHash).toBe('0xdef');
  });

  it('should fallback to supabase if 0G write fails', async () => {
    (is0GConfigured as jest.Mock).mockReturnValue(true);
    (kvWrite as jest.Mock).mockRejectedValue(new Error('0G Error'));

    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ upsert: mockUpsert });

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ key: 'test', value: 'val' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.source).toBe('supabase');
  });
  
  it('should fallback to supabase and throw error if supabase fails after 0g fail (non-Error)', async () => {
    (is0GConfigured as jest.Mock).mockReturnValue(true);
    (kvWrite as jest.Mock).mockRejectedValue('String Error');

    const mockUpsert = jest.fn().mockResolvedValue({ error: new Error('DB error fallback') });
    (supabase.from as jest.Mock).mockReturnValue({ upsert: mockUpsert });

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ key: 'test', value: 'val' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.details).toBe('DB error fallback');
  });
});
