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

    // Resolve routes whenever the hash changes.
    // Store must be initialized before resolving.
    window.addEventListener('hashchange', () => {
      if (window.__storeInitialized) {
        this.resolve();
      }
    });
  }

  // ==========================================================
  // Register Route
  // ==========================================================

  on(path, handler) {
    this.routes[path] = handler;
    return this;
  }

  // ==========================================================
  // Before Hooks
  // ==========================================================

  before(hook) {
    this.beforeHooks.push(hook);
    return this;
  }

  // ==========================================================
  // After Hooks
  // ==========================================================

  after(hook) {
    this.afterHooks.push(hook);
    return this;
  }

  // ==========================================================
  // Navigate
  // ==========================================================

  navigate(path) {
    window.location.hash = path;
  }

  // ==========================================================
  // Get Hash
  // ==========================================================

  getHash() {
    let hash = window.location.hash.slice(1);

    if (!hash) {
      return '/';
    }

    // Remove trailing slash except for root
    if (
      hash.length > 1 &&
      hash.endsWith('/')
    ) {
      hash = hash.slice(0, -1);
    }

    return hash;
  }

  // ==========================================================
  // Get Params
  // ==========================================================

  getParams() {
    const hash = this.getHash();

    const [path, queryString] =
      hash.split('?');

    const params = {};

    if (queryString) {

      queryString
        .split('&')
        .forEach(pair => {

          if (!pair) return;

          const [rawKey, ...rawValue] =
            pair.split('=');

          if (!rawKey) return;

          const key =
            decodeURIComponent(
              rawKey
            );

          const value =
            decodeURIComponent(
              rawValue.join('=') || ''
            );

          params[key] = value;

        });

    }

    return {
      path: path || '/',
      params
    };
  }

  // ==========================================================
  // Resolve Current Route
  // ==========================================================

  resolve() {

    const {
      path,
      params
    } = this.getParams();

    // --------------------------------------------------------
    // Before hooks
    // --------------------------------------------------------

    for (
      const hook of this.beforeHooks
    ) {

      if (
        hook(path, params) === false
      ) {
        return;
      }

    }

    // --------------------------------------------------------
    // Find matching route
    // --------------------------------------------------------

    let handler = null;
    let routeParams = {};

    for (
      const [
        route,
        routeHandler
      ] of Object.entries(
        this.routes
      )
    ) {

      const match =
        this.matchRoute(
          route,
          path
        );

      if (match) {

        handler =
          routeHandler;

        routeParams = {
          ...match,
          ...params
        };

        break;
      }

    }

    // --------------------------------------------------------
    // Route found
    // --------------------------------------------------------

    if (handler) {

      this.currentRoute =
        path;

      const container =
        document.getElementById(
          'main-content'
        );

      if (!container) {
        console.error(
          'CircuitKart Router: #main-content not found.'
        );
        return;
      }

      // Page transition
      container.classList.remove(
        'page-enter-active'
      );

      container.classList.add(
        'page-enter'
      );

      requestAnimationFrame(() => {

        try {

          handler(
            container,
            routeParams
          );

        } catch (error) {

          console.error(
            'Route rendering error:',
            error
          );

          container.innerHTML = `
            <div
              class="container section text-center"
              style="
                padding-top:
                  calc(
                    var(--nav-height) +
                    60px
                  );
                min-height:60vh;
              "
            >

              <h1
                class="heading-lg"
                style="
                  margin-bottom:var(--space-md);
                "
              >
                Something went wrong
              </h1>

              <p
                class="text-secondary"
                style="
                  margin-bottom:var(--space-xl);
                "
              >
                Unable to load this page.
              </p>

              <a
                href="#/"
                class="btn btn-primary"
              >
                Go Home
              </a>

            </div>
          `;

        }

        requestAnimationFrame(() => {

          container.classList.remove(
            'page-enter'
          );

          container.classList.add(
            'page-enter-active'
          );

        });

      });

      // ------------------------------------------------------
      // After hooks
      // ------------------------------------------------------

      for (
        const hook of this.afterHooks
      ) {

        try {

          hook(
            path,
            routeParams
          );

        } catch (error) {

          console.error(
            'Router after-hook error:',
            error
          );

        }

      }

    }

    // --------------------------------------------------------
    // 404
    // --------------------------------------------------------

    else {

      const container =
        document.getElementById(
          'main-content'
        );

      if (!container) {
        return;
      }

      container.innerHTML = `
        <div
          class="container"
          style="
            padding-top:
              calc(
                var(--nav-height) +
                60px
              );
            text-align:center;
            min-height:60vh;
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:center;
          "
        >

          <div
            style="
              font-size:5rem;
              line-height:1;
              font-weight:800;
              color:var(--text-heading);
              margin-bottom:var(--space-md);
            "
          >
            404
          </div>

          <h2
            class="heading-lg"
            style="
              margin-bottom:var(--space-sm);
            "
          >
            Page Not Found
          </h2>

          <p
            class="text-secondary"
            style="
              margin-bottom:var(--space-xl);
            "
          >
            The page you're looking for
            doesn't exist.
          </p>

          <div
            style="
              display:flex;
              gap:10px;
              flex-wrap:wrap;
              justify-content:center;
            "
          >

            <a
              href="#/"
              class="btn btn-primary"
            >
              <i
                data-lucide="home"
                style="width:16px;"
              ></i>
              Go Home
            </a>

            <a
              href="#/dashboard"
              class="btn btn-secondary"
            >
              <i
                data-lucide="layout-dashboard"
                style="width:16px;"
              ></i>
              Dashboard
            </a>

          </div>

        </div>
      `;

      if (window.lucide) {
        window.lucide.createIcons();
      }

    }

  }

  // ==========================================================
  // Match Route
  // ==========================================================

  matchRoute(
    route,
    path
  ) {

    // Normalize route
    let normalizedRoute =
      route || '/';

    if (
      normalizedRoute.length > 1 &&
      normalizedRoute.endsWith('/')
    ) {
      normalizedRoute =
        normalizedRoute.slice(
          0,
          -1
        );
    }

    // Normalize path
    let normalizedPath =
      path || '/';

    if (
      normalizedPath.length > 1 &&
      normalizedPath.endsWith('/')
    ) {
      normalizedPath =
        normalizedPath.slice(
          0,
          -1
        );
    }

    const routeParts =
      normalizedRoute.split('/');

    const pathParts =
      normalizedPath.split('/');

    // Number of segments must match
    if (
      routeParts.length !==
      pathParts.length
    ) {
      return null;
    }

    const params = {};

    for (
      let i = 0;
      i < routeParts.length;
      i++
    ) {

      const routePart =
        routeParts[i];

      const pathPart =
        pathParts[i];

      // Dynamic parameter
      if (
        routePart.startsWith(':')
      ) {

        const paramName =
          routePart.slice(1);

        if (!paramName) {
          return null;
        }

        params[paramName] =
          decodeURIComponent(
            pathPart
          );

      }

      // Static route segment
      else if (
        routePart !== pathPart
      ) {

        return null;

      }

    }

    return params;
  }

}


// ============================================================
// Export Router
// ============================================================

export const router =
  new Router();