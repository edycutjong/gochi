import { POST } from './route';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('POST /api/kv/write', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    const mockSelect = jest.fn().mockResolvedValue({ data: [{ key: 'test', value: 'val' }], error: null });
    const mockUpsert = jest.fn().mockReturnValue({ select: mockSelect });
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
    expect(data.data).toEqual([{ key: 'test', value: 'val' }]);
  });

  it('should return 500 if supabase error occurs', async () => {
    const mockSelect = jest.fn().mockResolvedValue({ data: null, error: new Error('DB error') });
    const mockUpsert = jest.fn().mockReturnValue({ select: mockSelect });
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
    const mockSelect = jest.fn().mockRejectedValue('String error');
    const mockUpsert = jest.fn().mockReturnValue({ select: mockSelect });
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
});
