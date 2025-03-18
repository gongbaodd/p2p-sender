import { Application } from "jsr:@oak/oak"
import { Router } from "jsr:@oak/oak/router"

const app = new Application()
const router = new Router()
const clients = new Set<WebSocket>()

router.get("/ws", ctx => {
  if (!ctx.isUpgradable) {
    ctx.throw(501)
  }

  const ws = ctx.upgrade()

  ws.onopen = () => {
    clients.add(ws)
    console.log(`${clients.size} users connected`);
    
  }

  ws.onmessage = (e) => {
    console.log(e.data)
    clients.forEach(client => {
      if (client.readyState !== WebSocket.OPEN) return

      client.send(e.data)
    })
  }

  ws.onclose = () => {
    clients.delete(ws)
    console.log(`${clients.size} users disconnected`)
  }
})

router.get("/", ctx => {
  ctx.response.redirect("/index.html")
})

app.use(router.routes())
app.use(router.allowedMethods())
app.use(async (ctx, next) => {
  try {
    await ctx.send({
      root: `${Deno.cwd()}/public`,
      index: "index.html"
    })
  } catch {
    await next()
  }
})

await app.listen({ port: 3000 })