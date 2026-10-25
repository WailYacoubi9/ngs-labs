const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function toInteger(value, defaultValue) {
  if (value === undefined) {
    return defaultValue;
  }
  return /^\d+$/.test(value) ? Number(value) : NaN;
}

// Reads ?page=...&limit=... and returns { page, limit }, or { error } when a value is invalid
export function readPagination(query) {
  const page = toInteger(query.page, 1);
  const limit = toInteger(query.limit, DEFAULT_LIMIT);

  if (!(page >= 1)) {
    return { error: 'page must be an integer greater than or equal to 1' };
  }
  if (!(limit >= 1 && limit <= MAX_LIMIT)) {
    return { error: `limit must be an integer between 1 and ${MAX_LIMIT}` };
  }
  return { page, limit };
}

// One page of a collection, with links to the previous and next pages
export function buildPage(items, { page, limit }, basePath, key) {
  const start = (page - 1) * limit;
  const link = (number) => ({ href: `${basePath}?page=${number}&limit=${limit}` });

  const links = { self: link(page) };
  if (page > 1) {
    links.prev = link(page - 1);
  }
  if (start + limit < items.length) {
    links.next = link(page + 1);
  }

  return {
    total: items.length,
    page,
    limit,
    [key]: items.slice(start, start + limit),
    _links: links,
  };
}
