// https://github.com/rxaviers/async-pool/blob/master/lib/es9.js
export async function* async_pool(concurrency, iterable, iterator_fn) {
  const executing = new Set();
  async function consume() {
    const [promise, value] = await Promise.race(executing);
    executing.delete(promise);
    return value;
  }

  for (const item of iterable) {
    const promise = (async () => await iterator_fn(item, iterable))().then((value) => [
      promise,
      value,
    ]);
    executing.add(promise);
    if (executing.size >= concurrency) {
      yield await consume();
    }
  }

  while (executing.size) {
    yield await consume();
  }
}

export async function async_pool_all(...args) {
  const results = [];
  for await (const result of async_pool(...args)) {
    if (result) results.push(result);
  }
  return results;
}
