export function startGrainBackground(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return;
  const ctx = context;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const bayer = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
  const colors = [[23,24,25], [86,91,88], [155,158,152]];
  const pointer = { x: 0.7, y: 0.3, tx: 0.7, ty: 0.3, energy: 0, inside: false };
  const ripples: { x: number; y: number; age: number }[] = [];
  let down: { id: number; x: number; y: number } | null = null;
  let image: ImageData | undefined;
  let width = 0, height = 0, raf = 0, lastTime = 0, phase = 0;
  const listeners: (() => void)[] = [];
  function listen<T extends Event>(target: EventTarget, type: string, listener: (event: T) => void, options?: AddEventListenerOptions) {
    target.addEventListener(type, listener as EventListener, options);
    listeners.push(() => target.removeEventListener(type, listener as EventListener, options));
  }
  let userPaused = false;
  const stopped = () => userPaused || reduced.matches || document.hidden;
  const interactive = (target: EventTarget | null) => target instanceof Element && target.closest('a,button,input,textarea,select,summary,[role=button]');

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nextWidth = Math.max(80, Math.min(320, Math.ceil(rect.width / 6)));
    const nextHeight = Math.max(80, Math.min(220, Math.round(nextWidth * rect.height / rect.width)));
    if (nextWidth === width && nextHeight === height) return;
    width = canvas.width = nextWidth;
    height = canvas.height = nextHeight;
    image = ctx.createImageData(width, height);
    render(0);
  }

  function render(delta: number) {
    if (!image) return;
    phase += delta * 0.14;
    const follow = 1 - Math.exp(-delta * 12);
    pointer.x += (pointer.tx - pointer.x) * follow;
    pointer.y += (pointer.ty - pointer.y) * follow;
    pointer.energy *= Math.exp(-delta * 3.5);
    for (let i = ripples.length - 1; i >= 0; i--) {
      ripples[i].age += delta;
      if (ripples[i].age > 3) ripples.splice(i, 1);
    }
    const px = pointer.x * width, py = pointer.y * height;
    const reach = Math.min(width, height) * 0.33;
    const strength = pointer.inside ? 0.35 + pointer.energy : pointer.energy;
    const waves = ripples.map(ripple => ({ x: ripple.x * width, y: ripple.y * height,
      radius: ripple.age * Math.min(width, height) * 0.42, amplitude: Math.exp(-ripple.age * 0.9) * 0.32 }));
    const pixels = image.data;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - px, dy = y - py;
        const falloff = Math.max(0, 1 - (dx * dx + dy * dy) / (reach * reach));
        const bend = falloff * falloff * strength;
        const sx = x - dy * bend * 0.9;
        const sy = y + dx * bend * 0.9;
        let value = Math.sin(sx * 0.025 + sy * 0.018 + phase) * 0.22
          + Math.cos(sx * 0.04 - sy * 0.033 - phase * 0.6) * 0.17
          + Math.sin(sy * 0.07 + phase) * 0.07 + 0.43;
        for (const wave of waves) {
          const distance = Math.hypot(x - wave.x, y - wave.y);
          const front = distance - wave.radius;
          value += Math.sin(front * 0.48) * Math.exp(-front * front / 220) * wave.amplitude;
        }
        const bright = value > bayer[(y % 4) * 4 + x % 4] / 16;
        const color = !bright ? colors[0] : value > 0.66 ? colors[2] : colors[1];
        const offset = (y * width + x) * 4;
        pixels[offset] = color[0]; pixels[offset + 1] = color[1]; pixels[offset + 2] = color[2]; pixels[offset + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }

  function tick(time: number) {
    raf = 0;
    if (stopped()) return;
    if (!lastTime) lastTime = time;
    const elapsed = time - lastTime;
    if (elapsed >= 1000 / 24) {
      render(Math.min(elapsed / 1000, 0.08));
      lastTime = time;
    }
    raf = requestAnimationFrame(tick);
  }

  function syncMotion() {
    cancelAnimationFrame(raf);
    raf = 0; lastTime = 0;
    if (!stopped()) raf = requestAnimationFrame(tick);
  }

  function point(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
  }

  listen(window, 'pointermove', (event: PointerEvent) => {
    if (stopped() || !finePointer.matches || event.pointerType === 'touch') return;
    const position = point(event);
    const distance = Math.hypot(position.x - pointer.tx, position.y - pointer.ty);
    pointer.tx = position.x; pointer.ty = position.y; pointer.inside = true;
    pointer.energy = Math.min(1.7, pointer.energy + distance * 8);
  }, { passive: true });
  listen(window, 'pointerout', (event: PointerEvent) => { if (!event.relatedTarget) pointer.inside = false; });
  listen(window, 'blur', () => { pointer.inside = false; down = null; });
  listen(window, 'pointerdown', (event: PointerEvent) => {
    if (!stopped() && event.isPrimary && event.button === 0 && !interactive(event.target))
      down = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }, { passive: true });
  listen(window, 'pointerup', (event: PointerEvent) => {
    if (!down || down.id !== event.pointerId) return;
    const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y);
    down = null;
    if (stopped() || moved > 14 || interactive(event.target)) return;
    const position = point(event);
    ripples.push({ ...position, age: 0 });
    if (ripples.length > 5) ripples.shift();
  }, { passive: true });
  listen(window, 'pointercancel', () => { down = null; });
  listen(document, 'visibilitychange', syncMotion);
  listen(reduced, 'change', syncMotion);
  listen(finePointer, 'change', syncMotion);
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  syncMotion();
  return {
    setPaused(paused: boolean) { userPaused = paused; down = null; syncMotion(); },
    destroy() {
      cancelAnimationFrame(raf);
      observer.disconnect();
      listeners.forEach(remove => remove());
    },
  };
}
