const seen = new Map();
const TTL_MS = 24 * 60 * 60 * 1000;

export function claim(hash) {
  if (seen.has(hash)) return false;
  seen.set(hash, Date.now());
  return true;
}

export function release(hash) {
  seen.delete(hash);
}

setInterval(() => {
  const cutoff = Date.now() - TTL_MS;
  for (const [k, t] of seen) {
    if (t < cutoff) seen.delete(k);
  }
}, 60 * 60 * 1000);
