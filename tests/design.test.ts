import assert from 'node:assert/strict';
import test from 'node:test';
import type { HomeConfig } from '../lib/home-config';

// Keep this executable in plain Node with --experimental-strip-types while
// allowing the application TypeScript config to use bundler module resolution.
const designModulePath = '../lib/design.ts';
const { basicDesign } = await import(designModulePath) as typeof import('../lib/design');
const current: HomeConfig = {
  architecture: 'courtyard', plants: 'olive', time: 'sunset',
  weather: 'rain', carColor: '#9d2927', wheels: 'black',
};

test('a wheel-only colour request preserves the existing body paint', () => {
  for (const prompt of ['换成银色轮毂', '银色的轮圈', '银轮', 'silver alloy wheels']) {
    const result = basicDesign(prompt, current);
    assert.deepEqual(result.config, { ...current, wheels: 'silver' });
    assert.doesNotMatch(result.summary, /车漆/);
  }
});

test('a wheel colour does not override a separate explicit body colour', () => {
  const result = basicDesign('红色车漆配银色轮毂', { ...current, carColor: '#466b82' });
  assert.equal(result.config.carColor, '#9d2927');
  assert.equal(result.config.wheels, 'silver');
});

test('negative rain requests switch rain off and preserve unrelated choices', () => {
  for (const prompt of ['不要下雨', '不下雨', '无雨', '停止下雨', 'no rain', 'without rain', 'stop the rain']) {
    const result = basicDesign(prompt, current);
    assert.deepEqual(result.config, { ...current, weather: 'clear' });
  }
});

test('a positive rain request still switches rain on', () => {
  assert.equal(basicDesign('下雨', { ...current, weather: 'clear' }).config.weather, 'rain');
});
