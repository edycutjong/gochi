import { GET } from './route';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('GET /api/log/memories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 500 if supabase error occurs', async () => {
    const mockLimit = jest.fn().mockResolvedValue({ data: null, error: new Error('DB error') });
    const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
    const mockIs = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = jest.fn().mockReturnValue({ is: mockIs, eq: mockEq, order: mockOrder });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const req = new Request('http://localhost');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch memories');
    expect(data.details).toBe('DB error');
  });

  it('should return 500 if non-Error is thrown', async () => {
    const mockLimit = jest.fn().mockRejectedValue('String error');
    const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
    const mockIs = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = jest.fn().mockReturnValue({ is: mockIs, eq: mockEq, order: mockOrder });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const req = new Request('http://localhost');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch memories');
    expect(data.details).toBe('Unknown error');
  });

  it('should filter memories by tokenId if provided', async () => {
    const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
    const mockIs = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = jest.fn().mockReturnValue({ is: mockIs, eq: mockEq, order: mockOrder });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const req = new Request('http://localhost?tokenId=99');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ memories: [], success: true });
    expect(mockEq).toHaveBeenCalledWith('token_id', '99');
  });

  it('should successfully fetch memories', async () => {
    const mockMemories = [
      { id: '1', type: 'FEED', title: 'Fed', time: '10:00', merkle_root: '0x1', tx_hash: '0x2' }
    ];
    const mockLimit = jest.fn().mockResolvedValue({ data: mockMemories, error: null });
    const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
    const mockIs = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = jest.fn().mockReturnValue({ is: mockIs, eq: mockEq, order: mockOrder });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const req = new Request('http://localhost');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.memories).toHaveLength(1);
    expect(data.memories[0]).toEqual({
      id: '1',
      type: 'FEED',
      title: 'Fed',
      time: '10:00',
      merkleRoot: '0x1',
      txHash: '0x2'
    });
  });

  it('should return empty array if data is null', async () => {
    const mockLimit = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
    const mockIs = jest.fn().mockReturnValue({ order: mockOrder });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = jest.fn().mockReturnValue({ is: mockIs, eq: mockEq, order: mockOrder });
    (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

    const req = new Request('http://localhost');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.memories).toEqual([]);
  });
});
