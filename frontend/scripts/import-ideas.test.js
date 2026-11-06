// @vitest-environment node
import { Buffer } from 'node:buffer';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { importIdeas, preparePhoto } from './import-ideas.js';

afterEach(() => vi.unstubAllGlobals());

function mockPocketBase() {
  const dates = {
    getFirstListItem: vi.fn(),
    create: vi.fn().mockResolvedValue({ id: 'generatedrecord' }),
    update: vi.fn().mockResolvedValue({ id: 'existingrecord' }),
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

    await expect(importIdeas(pb, [idea])).resolves.toEqual({ added: 1, updated: 0, skipped: 0 });

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

  it('skips an idea when all its seed fields already match', async () => {
    const { pb, dates } = mockPocketBase();
    dates.getFirstListItem.mockResolvedValue({ ...idea, id: 'existingrecord' });

    await expect(importIdeas(pb, [idea])).resolves.toEqual({ added: 0, updated: 0, skipped: 1 });
    expect(dates.create).not.toHaveBeenCalled();
    expect(dates.update).not.toHaveBeenCalled();
  });

  it('counts added and skipped ideas separately', async () => {
    const { pb, dates } = mockPocketBase();
    dates.getFirstListItem
      .mockResolvedValueOnce({ ...idea, id: 'existingrecord' })
      .mockRejectedValueOnce({ status: 404 });

    await expect(importIdeas(pb, [idea, { ...idea, title: 'Another date' }])).resolves.toEqual({
      added: 1,
      updated: 0,
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

  it('updates changed seed fields without replacing the record ID', async () => {
    const { pb, dates } = mockPocketBase();
    dates.getFirstListItem.mockResolvedValue({ ...idea, id: 'existingrecord', price: 10 });

    await expect(importIdeas(pb, [idea])).resolves.toEqual({ added: 0, updated: 1, skipped: 0 });
    expect(dates.update).toHaveBeenCalledWith(
      'existingrecord',
      expect.objectContaining({ price: 0 }),
      { requestKey: null },
    );
    expect(dates.create).not.toHaveBeenCalled();
  });

  it.each(['create', 'update'])(
    'uploads a cropped file when it must %s an idea',
    async (method) => {
      const { pb, dates } = mockPocketBase();
      if (method === 'create') dates.getFirstListItem.mockRejectedValue({ status: 404 });
      else dates.getFirstListItem.mockResolvedValue({ ...idea, id: 'existingrecord' });
      const source = await sharp({
        create: { width: 400, height: 800, channels: 3, background: 'green' },
      })
        .png()
        .toBuffer();
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(source)));

      const counts = await importIdeas(pb, [{ ...idea, photo: 'https://example.com/park.jpg' }]);
      const payload = dates[method].mock.calls[0][method === 'create' ? 0 : 1];
      expect(payload).toBeInstanceOf(FormData);
      expect(payload.get('id')).toBeNull();
      expect(payload.get('place_name')).toBe(idea.place_name);
      const photo = payload.get('photo');
      expect(photo.type).toBe('image/webp');
      expect(photo.size).toBeLessThan(200_000);
      expect(await sharp(Buffer.from(await photo.arrayBuffer())).metadata()).toMatchObject({
        width: 1200,
        height: 570,
        format: 'webp',
      });
      expect(counts).toEqual({
        added: method === 'create' ? 1 : 0,
        updated: method === 'update' ? 1 : 0,
        skipped: 0,
      });

      // PocketBase adds a suffix to an uploaded filename. A rerun still recognizes it.
      dates.getFirstListItem.mockResolvedValue({
        ...idea,
        id: 'existingrecord',
        photo: photo.name.replace('.webp', '_pb123.webp'),
      });
      dates.create.mockClear();
      dates.update.mockClear();
      vi.mocked(fetch).mockResolvedValue(new Response(source));
      await expect(
        importIdeas(pb, [{ ...idea, photo: 'https://example.com/park.jpg' }]),
      ).resolves.toEqual({ added: 0, updated: 0, skipped: 1 });
      expect(dates.create).not.toHaveBeenCalled();
      expect(dates.update).not.toHaveBeenCalled();
    },
  );

  it('leaves an existing record intact when its photo cannot be downloaded', async () => {
    const { pb, dates } = mockPocketBase();
    dates.getFirstListItem.mockResolvedValue({ ...idea, id: 'existingrecord' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 403 })));

    await expect(
      importIdeas(pb, [{ ...idea, photo: 'https://example.com/park.jpg' }]),
    ).rejects.toThrow(/photo.*403/i);
    expect(dates.update).not.toHaveBeenCalled();
    expect(dates.create).not.toHaveBeenCalled();
  });

  it('reports a failed photo update instead of counting it as updated', async () => {
    const { pb, dates } = mockPocketBase();
    dates.getFirstListItem.mockResolvedValue({ ...idea, id: 'existingrecord', price: 10 });
    const error = { status: 400 };
    dates.update.mockRejectedValue(error);
    await expect(importIdeas(pb, [idea])).rejects.toBe(error);
  });
});

describe('import photo preparation', () => {
  it('crops the center of a portrait image to the existing card shape', async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="1200"><path fill="red" d="M0 0h400v1200H0z"/><path fill="#00ff00" d="M0 400h400v400H0z"/></svg>',
    );
    const { data, filename } = await preparePhoto(svg);
    const image = sharp(data);
    expect(await image.metadata()).toMatchObject({ width: 1200, height: 570, format: 'webp' });
    const pixel = await image.extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer();
    expect(pixel[1]).toBeGreaterThan(240);
    expect(pixel[0]).toBeLessThan(15);
    expect(filename).toMatch(/^card_[a-f0-9]+\.webp$/);
  });

  it('keeps a detailed image strictly below 200 KB', async () => {
    const source = await sharp(randomBytes(1800 * 1200 * 3), {
      raw: { width: 1800, height: 1200, channels: 3 },
    })
      .png()
      .toBuffer();
    const { data } = await preparePhoto(source);
    expect(data.length).toBeLessThan(200_000);
    expect(await sharp(data).metadata()).toMatchObject({ width: 1200, height: 570 });
  });
});
