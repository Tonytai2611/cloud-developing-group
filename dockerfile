# Use the official Node.js image as the base image
FROM node:18-alpine

# Set the working directory to /app inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available) into the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the src directory into the container
COPY src ./src

# Build the Next.js app with a higher memory limit
RUN node --max-old-space-size=4096 ./node_modules/.bin/next build

# Expose the port Next.js runs on
EXPOSE 3000

# Start the application in production mode
CMD ["npm", "start"]
