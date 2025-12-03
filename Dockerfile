FROM nginx:alpine

# Add build argument for commit SHA
ARG COMMIT_SHA=unknown

# Copy all static files
COPY . /usr/share/nginx/html

# Run sed to replace the placeholder in index.html if needed
RUN sed -i "s/__COMMIT_SHA__/${COMMIT_SHA}/g" /usr/share/nginx/html/index.html || true
