import { GET } from './route';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('GET /api/kv/read', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if key is missing', async () => {
    const request = new Request('http://localhost/api/kv/read');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Key is required');
  });

  it('should successfully read from KV storage', async () => {
    const mockSingle = jest.fn().mockResolvedValue({ data: { value: 'val' }, error: null });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const request = new Request('http://localhost/api/kv/read?key=test');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(typeof data.latency).toBe('number');
    expect(data.value).toBe('val');
  });

  it('should return dummy state if no data found (PGRST116)', async () => {
    const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const request = new Request('http://localhost/api/kv/read?key=test');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.value.hunger).toBe(80);
    expect(data.value.mood).toBe(90);
    expect(data.value.energy).toBe(70);
  });

  it('should return 500 if non-PGRST116 supabase error occurs', async () => {
    const mockSingle = jest.fn().mockResolvedValue({ data: null, error: new Error('DB error') });
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const request = new Request('http://localhost/api/kv/read?key=test');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to read from KV Storage');
    expect(data.details).toBe('DB error');
  });

  it('should return 500 if non-Error is thrown', async () => {
    const mockSingle = jest.fn().mockRejectedValue('String error');
    const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const request = new Request('http://localhost/api/kv/read?key=test');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to read from KV Storage');
    expect(data.details).toBe('Unknown error');
  });
});
