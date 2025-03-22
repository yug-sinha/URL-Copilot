FROM node:18-alpine

WORKDIR /app

# Copy package files & install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Build the production bundle (Next.js or React)
RUN npm run build

# Expose the typical Next.js or React dev server port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start"]
