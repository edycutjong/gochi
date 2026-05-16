/* eslint-disable @typescript-eslint/no-explicit-any */
import { GET } from './route';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('GET /api/metadata/[tokenId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 for invalid token ID', async () => {
    const request = new Request('https://gochi.edycu.dev/api/metadata/abc');
    const response = await GET(request, { params: Promise.resolve({ tokenId: 'abc' }) });
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid token ID');
  });

  it('returns default metadata if supabase fetch fails', async () => {
    (supabase.from as jest.Mock).mockImplementation(() => {
      throw new Error('DB Error');
    });

    const request = new Request('https://gochi.edycu.dev/api/metadata/1');
    const response = await GET(request, { params: Promise.resolve({ tokenId: '1' }) });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.name).toBe('Gochi #1');
    expect(data.attributes.find((a: any) => a.trait_type === 'Hunger').value).toBe(80);
    expect(data.attributes.find((a: any) => a.trait_type === 'Mood').value).toBe(90);
    expect(data.attributes.find((a: any) => a.trait_type === 'Energy').value).toBe(70);
    expect(data.attributes.find((a: any) => a.trait_type === 'Memories Archived').value).toBe(0);
  });

  it('returns updated metadata from supabase', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn().mockResolvedValue({
      data: { value: { hunger: 50, mood: 40, energy: 30 } },
    });

    const mockSelectMemories = jest.fn().mockReturnThis();
    const mockEqMemories = jest.fn().mockResolvedValue({ count: 5 });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'gochi_kv') {
        return { select: mockSelect, eq: mockEq, single: mockSingle };
      }
      if (table === 'gochi_memories') {
        return { select: mockSelectMemories, eq: mockEqMemories };
      }
      return {};
    });

    const request = new Request('https://gochi.edycu.dev/api/metadata/2');
    const response = await GET(request, { params: Promise.resolve({ tokenId: '2' }) });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.name).toBe('Gochi #2');
    expect(data.attributes.find((a: any) => a.trait_type === 'Hunger').value).toBe(50);
    expect(data.attributes.find((a: any) => a.trait_type === 'Hunger Status').value).toBe('OK');
    expect(data.attributes.find((a: any) => a.trait_type === 'Mood').value).toBe(40);
    expect(data.attributes.find((a: any) => a.trait_type === 'Mood Status').value).toBe('Low');
    expect(data.attributes.find((a: any) => a.trait_type === 'Energy').value).toBe(30);
    expect(data.attributes.find((a: any) => a.trait_type === 'Energy Status').value).toBe('Low');
    expect(data.attributes.find((a: any) => a.trait_type === 'Memories Archived').value).toBe(5);
  });

  it('handles low energy status', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn().mockResolvedValue({
      data: { value: { energy: 10 } }, // critical
    });
    
    const mockSelectMemories = jest.fn().mockReturnThis();
    const mockEqMemories = jest.fn().mockResolvedValue({ count: 0 });

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'gochi_kv') {
        return { select: mockSelect, eq: mockEq, single: mockSingle };
      }
      if (table === 'gochi_memories') {
        return { select: mockSelectMemories, eq: mockEqMemories };
      }
      return {};
    });

    const request = new Request('https://gochi.edycu.dev/api/metadata/3');
    const response = await GET(request, { params: Promise.resolve({ tokenId: '3' }) });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.attributes.find((a: any) => a.trait_type === 'Energy Status').value).toBe('Critical');
  });

  it('uses default metadata if supabase returns partial or empty data', async () => {
    const mockSelect = jest.fn().mockReturnThis();
    const mockEq = jest.fn().mockReturnThis();
    const mockSingle = jest.fn().mockResolvedValue({
      data: { value: {} }, // Empty value object
    });
    
    const mockSelectMemories = jest.fn().mockReturnThis();
    const mockEqMemories = jest.fn().mockResolvedValue({ count: null }); // Missing count

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'gochi_kv') {
        return { select: mockSelect, eq: mockEq, single: mockSingle };
      }
      if (table === 'gochi_memories') {
        return { select: mockSelectMemories, eq: mockEqMemories };
      }
      return {};
    });

    const request = new Request('https://gochi.edycu.dev/api/metadata/4');
    const response = await GET(request, { params: Promise.resolve({ tokenId: '4' }) });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.attributes.find((a: any) => a.trait_type === 'Hunger').value).toBe(80);
    expect(data.attributes.find((a: any) => a.trait_type === 'Mood').value).toBe(90);
    expect(data.attributes.find((a: any) => a.trait_type === 'Energy').value).toBe(70);
    expect(data.attributes.find((a: any) => a.trait_type === 'Memories Archived').value).toBe(0);
  });
});
