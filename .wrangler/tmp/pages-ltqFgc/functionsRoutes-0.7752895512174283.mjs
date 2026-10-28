import { onRequest as __api___path___js_onRequest } from "/home/user/SynthZ-Style/functions/api/[[path]].js"
import { onRequest as __sintetico_js_onRequest } from "/home/user/SynthZ-Style/functions/sintetico.js"

export const routes = [
    {
      routePath: "/api/:path*",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api___path___js_onRequest],
    },
  {
      routePath: "/sintetico",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__sintetico_js_onRequest],
    },
  ]