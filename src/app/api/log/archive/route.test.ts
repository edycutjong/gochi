import { POST } from './route';
import { supabase } from '@/lib/supabase';
import { is0GConfigured, logUpload } from '@/lib/zero-g';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('@/lib/zero-g', () => ({
  is0GConfigured: jest.fn(),
  logUpload: jest.fn(),
}));

describe('POST /api/log/archive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (is0GConfigured as jest.Mock).mockReturnValue(false);
    jest.spyOn(console, 'warn').mockImplementation(() => {});
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
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
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
  });

  it('should return 500 if supabase error occurs', async () => {
    // Note: The route doesn't actually return 500 on Supabase insert failure, it just warns.
    // However, if the mock itself throws an error, it will be caught by the outer catch.
    const mockInsert = jest.fn().mockRejectedValue(new Error('DB error'));
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
    const mockInsert = jest.fn().mockRejectedValue('String error');
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

  it('should log warning if supabase insert returns an error', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: { message: 'Insert failed' } });
    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });
    
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ action: 'fed', title: 'Fed Gochi', txHash: '0x123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(console.warn).toHaveBeenCalledWith('Supabase memory insert failed:', 'Insert failed');
  });

  it('should successfully archive log to 0G storage', async () => {
    (is0GConfigured as jest.Mock).mockReturnValue(true);
    (logUpload as jest.Mock).mockResolvedValue({ txHash: '0x0g', rootHash: '0xroot' });

    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ action: 'fed', title: 'Fed Gochi', txHash: '0x123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.source).toBe('zerog');
    expect(data.txHash).toBe('0x0g');
    expect(data.merkleRoot).toBe('0xroot');
  });

  it('should fallback to supabase if 0G log upload fails', async () => {
    (is0GConfigured as jest.Mock).mockReturnValue(true);
    (logUpload as jest.Mock).mockRejectedValue(new Error('0G Error'));

    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ action: 'fed', title: 'Fed Gochi', txHash: '0x123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.source).toBe('supabase');
    expect(data.txHash).toBeUndefined(); // It falls back to kvTxHash eventually or undefined if not set
  });

  it('should fallback to supabase if 0G log upload fails (non-Error)', async () => {
    (is0GConfigured as jest.Mock).mockReturnValue(true);
    (logUpload as jest.Mock).mockRejectedValue('String Error');

    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ action: 'fed', title: 'Fed Gochi', txHash: '0x123' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.source).toBe('supabase');
  });
});
