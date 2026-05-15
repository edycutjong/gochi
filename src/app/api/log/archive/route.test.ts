import { POST } from './route';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('POST /api/log/archive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if action is missing', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ title: 'test title', txHash: '0x123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Action content is required');
  });

  it('should successfully archive log to storage', async () => {
    const mockSelect = jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null });
    const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ action: 'fed', title: 'Fed Gochi', txHash: '0x123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.merkleRoot).toBeDefined();
    expect(typeof data.latency).toBe('number');
    expect(data.data).toEqual([{ id: '1' }]);
  });

  it('should return 500 if supabase error occurs', async () => {
    const mockSelect = jest.fn().mockResolvedValue({ data: null, error: new Error('DB error') });
    const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ action: 'fed', title: 'Fed Gochi', txHash: '0x123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to archive memory to Storage Log');
    expect(data.details).toBe('DB error');
  });

  it('should return 500 if non-Error is thrown', async () => {
    const mockSelect = jest.fn().mockRejectedValue('String error');
    const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ action: 'fed', title: 'Fed Gochi', txHash: '0x123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to archive memory to Storage Log');
    expect(data.details).toBe('Unknown error');
  });
});
