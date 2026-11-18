// Static demo shim for EdgeTerminal.
// The real app talks to a FastAPI backend. This demo has no server, so every
// /api/ call is answered from a captured snapshot (read-only, NFL week 11).
// Writes (the update check, saving, sign-in) are stubbed so the UI stays live.
(function () {
  const BASE = "/edgeterminal";
  const realFetch = window.fetch.bind(window);

  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  async function snapshot(pathname) {
    // /api/product/nfl  ->  /edgeterminal/data/api/product/nfl.json
    const res = await realFetch(`${BASE}/data${pathname}.json`, { cache: "no-store" });
    if (res.ok) return json(await res.json());
    return json({}); // unknown read: empty 200 so the app never throws
  }

  window.fetch = function (input, options = {}) {
    const url = new URL(
      typeof input === "string" ? input : input.url,
      window.location.origin
    );
    const path = url.pathname;
    const method = (options.method || "GET").toUpperCase();

    if (!path.startsWith("/api/")) return realFetch(input, options);

    // Update check: pretend nothing is due.
    if (path.endsWith("/check")) {
      return Promise.resolve(json({ ok: true, status: "idle", did_work: false }));
    }
    // Sign-in / auth is disabled in the demo.
    if (path.startsWith("/api/auth/")) {
      return Promise.resolve(json({ message: "Sign-in is disabled in this read-only demo." }));
    }
    // Saved research: always empty in the demo.
    if (path.startsWith("/api/account/saved")) return Promise.resolve(json({ games: [], props: [] }));
    if (path.startsWith("/api/account/alerts")) return Promise.resolve(json({ alerts: [] }));

    if (method === "GET") return snapshot(path);
    // Any other write (save/delete): accept and no-op.
    return Promise.resolve(json({ ok: true }));
  };
})();
