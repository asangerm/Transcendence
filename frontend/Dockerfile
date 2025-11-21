FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the development server with host set to 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 