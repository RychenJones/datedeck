import { describe, expect, it, vi } from 'vitest';
import { importIdeas } from './import-ideas.js';

function mockPocketBase() {
  const dates = {
    getFirstListItem: vi.fn(),
    create: vi.fn().mockResolvedValue({ id: 'generatedrecord' }),
  };
  const pb = {
    collection: vi.fn().mockReturnValue(dates),
    filter: vi.fn().mockReturnValue('filter'),
  };
  return { pb, dates };
}

const idea = {
  id: 'seed-1',
  title: 'A "quoted" date',
  place_name: 'Porter Park',
  address: 'S 2nd W and W 2nd S, Rexburg, ID 83440',
  location: 'Downtown Rexburg',
  price: 0,
  duration: 60,
  category: 'Outdoors',
  description: 'Enjoy a walk together.',
  photo: '',
};

describe('idea import', () => {
  it('adds a missing idea and lets PocketBase generate its record ID', async () => {
    const { pb, dates } = mockPocketBase();
    dates.getFirstListItem.mockRejectedValue({ status: 404 });

    await expect(importIdeas(pb, [idea])).resolves.toEqual({ added: 1, skipped: 0 });

    expect(pb.collection).toHaveBeenCalledWith('dates');
    expect(pb.filter).toHaveBeenCalledWith('title = {:title} && place_name = {:place}', {
      title: idea.title,
      place: idea.place_name,
    });
    expect(dates.getFirstListItem).toHaveBeenCalledWith('filter', { requestKey: null });
    const expected = { ...idea };
    delete expected.id;
    expect(dates.create).toHaveBeenCalledWith(expected, { requestKey: null });
    expect(idea.id).toBe('seed-1');
  });

  it('skips an idea when the same title and place already exist', async () => {
    const { pb, dates } = mockPocketBase();
    dates.getFirstListItem.mockResolvedValue({ id: 'existingrecord' });

    await expect(importIdeas(pb, [idea])).resolves.toEqual({ added: 0, skipped: 1 });
    expect(dates.create).not.toHaveBeenCalled();
  });

  it('counts added and skipped ideas separately', async () => {
    const { pb, dates } = mockPocketBase();
    dates.getFirstListItem
      .mockResolvedValueOnce({ id: 'existingrecord' })
      .mockRejectedValueOnce({ status: 404 });

    await expect(importIdeas(pb, [idea, { ...idea, title: 'Another date' }])).resolves.toEqual({
      added: 1,
      skipped: 1,
    });
    expect(dates.create).toHaveBeenCalledTimes(1);
  });

  it.each([403, 500])('stops without inserting when lookup fails with HTTP %s', async (status) => {
    const { pb, dates } = mockPocketBase();
    const error = { status };
    dates.getFirstListItem.mockRejectedValue(error);

    await expect(importIdeas(pb, [idea])).rejects.toBe(error);
    expect(dates.create).not.toHaveBeenCalled();
  });

  it('reports a failed insert instead of counting it as added', async () => {
    const { pb, dates } = mockPocketBase();
    dates.getFirstListItem.mockRejectedValue({ status: 404 });
    const error = { status: 400 };
    dates.create.mockRejectedValue(error);

    await expect(importIdeas(pb, [idea])).rejects.toBe(error);
  });
});
