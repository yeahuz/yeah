export async function payme(req, reply) {}

export async function octo(req, reply) {
  console.log("here");
  console.log(req.body);
  return reply.send({ accept_status: "capture" });
}

export async function click(req, reply) {}
