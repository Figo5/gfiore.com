import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const source = ts.transpileModule(fs.readFileSync(new URL('../app/grain-background.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

function mount({ reducedMotion = false, available = true } = {}) {
  const listeners = new Map(), frames = new Map();
  let frameID = 0, time = 0, pixels, disconnected = false;
  class Target {
    constructor(prefix) { this.prefix = prefix; }
    addEventListener(type, fn) { listeners.set(this.prefix + type, fn); }
    removeEventListener(type, fn) { if (listeners.get(this.prefix + type) === fn) listeners.delete(this.prefix + type); }
  }
  class Element {
    constructor(control) { this.control = control; }
    closest() { return this.control; }
  }
  const window = new Target('window:'), document = new Target('document:');
  const reduced = new Target('reduced:'), fine = new Target('fine:');
  reduced.matches = reducedMotion; fine.matches = true; document.hidden = false;
  const context = { createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData: image => { pixels = image.data.slice(); } };
  const canvas = { getContext: () => available ? context : null, getBoundingClientRect: () => ({ left: 0, top: 0, width: 720, height: 480 }) };
  const exports = {};
  vm.runInNewContext(source, {
    exports, window, document, Element,
    matchMedia: query => query.includes('reduced') ? reduced : fine,
    ResizeObserver: class { observe() {} disconnect() { disconnected = true; } },
    requestAnimationFrame: fn => { frames.set(++frameID, fn); return frameID; },
    cancelAnimationFrame: id => frames.delete(id),
  });
  const controller = exports.startGrainBackground(canvas);
  return {
    controller, document, reduced, frames, listeners, disconnected: () => disconnected,
    pixels: () => Buffer.from(pixels),
    event: (name, event = {}) => listeners.get(name)?.(event),
    pointer(type, x, y, { control = false, pointerType = 'mouse' } = {}) {
      this.event('window:' + type, { clientX: x, clientY: y, pointerId: 1, pointerType, isPrimary: true, button: 0, target: new Element(control) });
    },
    advance(count = 6) {
      for (let i = 0; i < count; i++) {
        time += 50;
        const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(time));
      }
    },
  };
}

function click(h, x, y, options) { h.pointer('pointerdown', x, y, options); h.pointer('pointerup', x, y, options); }

test('pointer movement and background taps deform the rendered grain', () => {
  const plain = mount(), moved = mount(), tapped = mount();
  moved.pointer('pointermove', 540, 120);
  click(tapped, 540, 120, { pointerType: 'touch' });
  [plain, moved, tapped].forEach(h => h.advance());
  assert(!moved.pixels().equals(plain.pixels()));
  assert(!tapped.pixels().equals(plain.pixels()));
});

test('links, scroll drags and cancelled pointers do not trigger ripples', () => {
  const plain = mount(), control = mount(), dragged = mount(), cancelled = mount();
  click(control, 540, 120, { control: true });
  dragged.pointer('pointerdown', 540, 120); dragged.pointer('pointerup', 540, 220);
  cancelled.pointer('pointerdown', 540, 120); cancelled.event('window:pointercancel'); cancelled.pointer('pointerup', 540, 120);
  [plain, control, dragged, cancelled].forEach(h => h.advance());
  for (const h of [control, dragged, cancelled]) assert(h.pixels().equals(plain.pixels()));
});

test('pause, hidden tabs, reduced motion and unmount stop background work', () => {
  const h = mount();
  h.controller.setPaused(true); assert.equal(h.frames.size, 0);
  const frozen = h.pixels(); click(h, 500, 200); h.pointer('pointermove', 200, 200); h.advance();
  assert(h.pixels().equals(frozen));
  h.controller.setPaused(false); assert.equal(h.frames.size, 1);
  h.document.hidden = true; h.event('document:visibilitychange'); assert.equal(h.frames.size, 0);
  h.document.hidden = false; h.event('document:visibilitychange'); assert.equal(h.frames.size, 1);
  h.reduced.matches = true; h.event('reduced:change'); assert.equal(h.frames.size, 0);
  h.reduced.matches = false; h.event('reduced:change'); assert.equal(h.frames.size, 1);
  h.controller.destroy(); assert.equal(h.frames.size, 0); assert.equal(h.listeners.size, 0); assert(h.disconnected());
});

test('reduced motion starts with a static field and unavailable canvas degrades safely', () => {
  const h = mount({ reducedMotion: true });
  assert(h.pixels().length > 0); assert.equal(h.frames.size, 0);
  h.controller.setPaused(false); assert.equal(h.frames.size, 0);
  const unavailable = mount({ available: false });
  assert.equal(unavailable.controller, undefined); assert.equal(unavailable.listeners.size, 0);
});

test('ripples are bounded and expire instead of accumulating', () => {
  const six = mount(), lastFive = mount(), plain = mount();
  const positions = [[100,100],[200,150],[300,200],[400,250],[500,300],[600,350]];
  positions.forEach(([x,y]) => click(six,x,y));
  positions.slice(1).forEach(([x,y]) => click(lastFive,x,y));
  [six,lastFive,plain].forEach(h => h.advance());
  assert(six.pixels().equals(lastFive.pixels()));
  [six,plain].forEach(h => h.advance(70));
  assert(six.pixels().equals(plain.pixels()));
});
