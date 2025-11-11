# Use Alpine-based Node.js image for smaller size and better security
FROM node:18-alpine

# Create and set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json files to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port on which the app will run
EXPOSE 3000

# Run as non-root user for security
USER node

# Start the application
CMD ["npm", "start"]
