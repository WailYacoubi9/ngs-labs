// A route like /students/:ine becomes the regular expression ^/students/([a-zA-Z0-9-]+)/?$
// The trailing slash is optional, so /students/A12 and /students/A12/ both match.
export function toRegExp(path) {
  const withoutTrailingSlash = path.replace(/\/+$/, '');
  const pattern = withoutTrailingSlash.replace(/:[a-zA-Z0-9_]+/g, '([a-zA-Z0-9-]+)');
  return new RegExp('^' + pattern + '/?$');
}

// Names of the parameters of a route: /modules/:code/teachers -> ['code']
export function paramNames(path) {
  const names = path.match(/:[a-zA-Z0-9_]+/g) ?? [];
  return names.map((name) => name.slice(1));
}

// Routing table: each route has a method, a regular expression built from its path and a handler
export default class Router {
  constructor() {
    this.routes = [];
  }

  add(method, path, handler) {
    this.routes.push({
      method: method.toUpperCase(),
      regexp: toRegExp(path),
      names: paramNames(path),
      handler,
    });
  }

  // Returns the handler of the first route that matches, with the values of its parameters,
  // or null when no route matches
  find(method, pathname) {
    for (const route of this.routes) {
      if (route.method === method && route.regexp.test(pathname)) {
        const values = pathname.match(route.regexp).slice(1);
        const params = {};
        route.names.forEach((name, i) => {
          params[name] = values[i];
        });
        return { handler: route.handler, params };
      }
    }
    return null;
  }
}
