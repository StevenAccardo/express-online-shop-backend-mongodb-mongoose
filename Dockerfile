#Use the official Node.js:lts runtime as a base image
FROM node:lts

# The node:lts images comes with a non-root user named node
# Ensure user node owns this directory
RUN mkdir -p /home/node/app && chown -R node:node /home/node/app

# Set the CWD
WORKDIR /home/node/app  

# Install PM2 globally
RUN npm i -g pm2

# Copy package.json, package-lock.json, and process.yml to the working directory
COPY --chown=node:node package*.json process.yml ./

# Switch to user node
USER node

# Install only production dependencies
RUN npm install --omit=dev

# Copy the rest of the application code to the working directory
COPY --chown=node:node . .

# Sets the env var
ENV NODE_ENV=production
# ENV PORT=4000 - AWS doesn't allow for the setting of PORT as an env var

# Documents what port we want exposed on the container in order for requests to access our service
EXPOSE 4000

# Now that our production dependencies have been installed and we are running only JavaScript code, we can use the node command to start our application without any other configuration 
# ENTRYPOINT [ "node", "./build/index.js" ]
ENTRYPOINT [ "pm2-runtime", "./process.yml" ]