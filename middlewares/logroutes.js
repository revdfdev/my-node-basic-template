// RouteLogger class encapsulates route logging functionality
class RouteLogger {
    static EMPTY_PATH = '';
    static PATH_SEPARATOR = '/';
    static NO_ROUTES_MESSAGE = 'No routes registered.';
    static ROUTES_HEADER = '🔍 Registered Routes:';
    static METHOD_PADDING = 10;
    
    constructor(app, logger = console) {
        this.app = app;
        this.logger = logger;
        this.routes = [];
    }

    logRegisteredRoutes() {
        if (!this.isValidExpressApp()) {
            this.logger.warn('Express app not initialized or has no routes.');
            return;
        }

        this.extractRoutesFromMiddleware(this.app._router.stack);
        this.printRoutes();
    }

    isValidExpressApp() {
        return this.app?._router?.stack;
    }

    extractRoutesFromMiddleware(stack, basePath = '') {
        stack.forEach(middleware => {
            if (this.isRouteMiddleware(middleware)) {
                this.addRoute(this.createRoute(middleware, basePath));
            } else if (this.isRouterMiddleware(middleware)) {
                this.processRouterMiddleware(middleware, basePath);
            }
        });
    }

    isRouteMiddleware(middleware) {
        return middleware.route;
    }

    isRouterMiddleware(middleware) {
        return middleware.name === 'router' || middleware.handle?.stack;
    }

    createRoute(middleware, basePath) {
        const path = this.normalizePath(basePath + (middleware.route.path || ''));
        const methods = this.extractHttpMethods(middleware.route.methods);
        return { path, methods };
    }

    extractHttpMethods(methodsObj) {
        return Object.keys(methodsObj)
            .filter(method => methodsObj[method])
            .map(method => method.toUpperCase())
            .join(', ');
    }

    processRouterMiddleware(middleware, basePath) {
        const routerPath = basePath + this.parseRegexPath(middleware.regexp);
        const subStack = middleware.handle?.stack || middleware.handle;
        
        if (Array.isArray(subStack)) {
            this.extractRoutesFromMiddleware(subStack, routerPath);
        }
    }

    parseRegexPath(regex) {
        if (!regex) return RouteLogger.EMPTY_PATH;
        
        const match = regex.toString().match(/^\/\^\\\/(.*)\\\/\?\$\//);
        return match ? RouteLogger.PATH_SEPARATOR + match[1].replace(/\\\//g, '/') : RouteLogger.EMPTY_PATH;
    }

    normalizePath(path) {
        return path.replace(/\/+/g, RouteLogger.PATH_SEPARATOR);
    }

    addRoute(route) {
        this.routes.push(route);
    }

    printRoutes() {
        this.logger.info(RouteLogger.ROUTES_HEADER);
        
        if (this.routes.length === 0) {
            this.logger.info(RouteLogger.NO_ROUTES_MESSAGE);
            return;
        }

        this.routes.forEach(route => {
            this.logger.info(`${route.methods.padEnd(RouteLogger.METHOD_PADDING)} ${route.path}`);
        });
    }
}

const logRoutes = (app, logger = console) => {
    const routeLogger = new RouteLogger(app, logger);
    routeLogger.logRegisteredRoutes();
};

module.exports = {
    logRoutes
};