import Fastify from 'fastify'
import cors from '@fastify/cors'
import dbPlugin from "./db"

async function startServer() {
	const fastify = Fastify({
		logger: true
	});

	// Enable CORS
	await fastify.register(cors, {
		origin: true
	});

	await fastify.register(dbPlugin);

	// Test route
	fastify.get('/', async (request, reply) => {
		return { message: 'Backend is working!' }
	});
	
	// Database test route
	fastify.get('/db-test', async (request, reply) => {
		try {
			// Test if database is accessible
			const result = fastify.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{name: string}>;
			return { 
				message: 'Database is working!',
				tables: result.map((row: {name: string}) => row.name)
			}
		} catch (error) {
			return { 
				message: 'Database error',
				error: (error as Error).message 
			}
		}
	});

	// Start the server
	try {
		await fastify.listen({ port: 8000, host: '0.0.0.0' })
	} catch (err) {
		fastify.log.error(err)
		process.exit(1)
	}
}

startServer()