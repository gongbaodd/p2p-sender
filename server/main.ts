import { Server } from "https://deno.land/x/socket_io@0.2.1/mod.ts";
import { Application } from "jsr:@oak/oak"

const app = new Application();

const io = new Server({
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  }
});


io.on("connection", (socket) => {
  console.log(`socket ${socket.id} connected`);

  socket.emit("hello", "world");

  socket.on("disconnect", (reason) => {
    console.log(`socket ${socket.id} disconnected due to ${reason}`);
  });
});

const handler = io.handler(async req => {
  return await app.handle(req) || new Response(null, { status: 404 })
})

Deno.serve({
  handler,
  port: 3000,
});