export default async function (fastify) {
    fastify.get('/', async (request, reply) => {
    return { message: 'Backend is working !' };
    });
}