// ============================================================
// CircuitKart — SPA Router
// Hash-based client-side routing
// ============================================================

class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.beforeHooks = [];
    this.afterHooks = [];
    // Only resolve on hashchange after store has been initialized
    window.addEventListener('hashchange', () => {
      if (window.__storeInitialized) this.resolve();
    });
    // Do NOT auto-resolve on 'load' — initApp calls router.resolve() explicitly after awaiting store.init()
  }

  on(path, handler) {
    this.routes[path] = handler;
    return this;
  }

  before(hook) {
    this.beforeHooks.push(hook);
    return this;
  }

  after(hook) {
    this.afterHooks.push(hook);
    return this;
  }

  navigate(path) {
    window.location.hash = path;
  }

  getHash() {
    return window.location.hash.slice(1) || '/';
  }

  getParams() {
    const hash = this.getHash();
    const [path, queryString] = hash.split('?');
    const params = {};
    if (queryString) {
      queryString.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
      });
    }
    return { path, params };
  }

  resolve() {
    const { path, params } = this.getParams();

    // Run before hooks
    for (const hook of this.beforeHooks) {
      if (hook(path, params) === false) return;
    }

    // Find matching route
    let handler = null;
    let routeParams = {};

    for (const [route, routeHandler] of Object.entries(this.routes)) {
      const match = this.matchRoute(route, path);
      if (match) {
        handler = routeHandler;
        routeParams = { ...match, ...params };
        break;
      }
    }

    if (handler) {
      this.currentRoute = path;
      const container = document.getElementById('main-content');

      // Page transition
      container.classList.remove('page-enter-active');
      container.classList.add('page-enter');

      requestAnimationFrame(() => {
        handler(container, routeParams);
        requestAnimationFrame(() => {
          container.classList.remove('page-enter');
          container.classList.add('page-enter-active');
        });
      });

      // Run after hooks
      for (const hook of this.afterHooks) {
        hook(path, routeParams);
      }
    } else {
      // 404
      const container = document.getElementById('main-content');
      container.innerHTML = `
        <div class="container" style="padding-top: calc(var(--nav-height) + 60px); text-align: center; min-height: 60vh;">
          <h1 class="heading-xl" style="margin-bottom: var(--space-md);">404</h1>
          <p class="text-secondary" style="margin-bottom: var(--space-xl);">Page not found</p>
          <a href="#/" class="btn btn-primary">Go Home</a>
        </div>
      `;
    }
  }

  matchRoute(route, path) {
    const routeParts = route.split('/');
    const pathParts = path.split('/');

    if (routeParts.length !== pathParts.length) return null;

    const params = {};
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        params[routeParts[i].slice(1)] = pathParts[i];
      } else if (routeParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return params;
  }
}

export const router = new Router();
