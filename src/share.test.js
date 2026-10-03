import { describe, expect, it } from 'vitest';
import { inflateSync } from 'node:zlib';
import { readFileSync, writeFileSync } from 'node:fs';
import { parseSharedRecord, sharePath } from './share';
import worker from '../worker/index';
import { shareImage } from '../worker/share-image';
const origin='https://what-grade.quiz-lab.workers.dev';
const env={ASSETS:{fetch:async () => new Response(readFileSync('index.html','utf8'),{headers:{'Content-Type':'text/html'}})}};
describe('result sharing', () => {
  it('round trips distinct records and rejects malformed or out-of-range URLs', () => {
    const record={grade:10,score:10,seconds:46};
    expect(parseSharedRecord(sharePath(record))).toEqual(record);
    expect(sharePath({...record,seconds:47})).not.toBe(sharePath(record));
    for(const path of ['/share/v1/11/10/46','/share/v1/9/11/46','/share/v1/9/10/201','/share/v1/9/10/-1','/share/v1/9/10/046','/share/v1/<script>/10/46']) expect(parseSharedRecord(path)).toBeNull();
  });
  it('serves record-specific metadata to crawlers without JavaScript', async () => {
    const html=await (await worker.fetch(new Request(origin+'/share/v1/9/10/46'),env)).text();
    expect(html).toContain('<title>나의 수학 나이는 중학교 3학년!</title>');
    expect(html).toContain('10문제 중 10개 정답 · 46초');
    expect(html).toContain('property="og:image" content="'+origin+'/share-card/v1/9/10/46.png"');
    expect(html).toContain('<div id="root">');
    const high=await (await worker.fetch(new Request(origin+'/share/v1/10/10/46'),env)).text();
    expect(high).toContain('고등학교 1학년');
    const other=await (await worker.fetch(new Request(origin+'/share/v1/5/7/99'),env)).text();
    expect(other).toContain('초등 5학년');
    expect(other).toContain('7개 정답 · 99초');
  });
  it('creates a valid PNG with record-specific pixels and no external font service', async () => {
    const png=await shareImage({grade:9,score:10,seconds:46});
    expect(Array.from(png.slice(0,8))).toEqual([137,80,78,71,13,10,26,10]);
    const view=new DataView(png.buffer);
    expect(view.getUint32(16)).toBe(800); expect(view.getUint32(20)).toBe(420);
    let offset=8; let payload;
    while(offset<png.length) {
      const len=view.getUint32(offset), type=new TextDecoder().decode(png.slice(offset+4,offset+8));
      if(type==='IDAT') payload=png.slice(offset+8,offset+8+len);
      offset+=12+len;
    }
    expect(inflateSync(payload).length).toBe((800*3+1)*420);
    expect(png).not.toEqual(await shareImage({grade:9,score:9,seconds:47}));
    writeFileSync('/tmp/what-grade-share-preview.png',await shareImage({grade:10,score:10,seconds:46}));
  });
  it('handles image routes, HEAD and invalid records while preserving ordinary assets', async () => {
    const image=await worker.fetch(new Request(origin+'/share-card/v1/9/10/46.png'),env);
    expect(image.headers.get('Content-Type')).toBe('image/png');
    expect((await image.arrayBuffer()).byteLength).toBeGreaterThan(1000);
    const head=await worker.fetch(new Request(origin+'/share/v1/9/10/46',{method:'HEAD'}),env);
    expect(await head.text()).toBe('');
    expect((await worker.fetch(new Request(origin+'/share/v1/9/11/46'),env)).status).toBe(404);
    expect((await worker.fetch(new Request(origin+'/share-card/v1/9/10/46.svg'),env)).status).toBe(404);
    expect(await (await worker.fetch(new Request(origin+'/'),env)).text()).toContain('몇 학년?');
  });
});
