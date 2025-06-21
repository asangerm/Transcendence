#!/bin/sh

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Create initial migration if it doesn't exist
if [ ! -d "prisma/migrations" ]; then
    echo "Creating initial migration..."
    npx prisma migrate dev --name init --create-only
fi

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start Prisma Studio in the background
echo "Starting Prisma Studio..."
npx prisma studio --port 5555 --hostname 0.0.0.0 &

# Start the application
echo "Starting the application..."
npm run start:dev 