FROM nginx:1.25-alpine

# Set default port if not provided by Cloud Run
ENV PORT 8080

# Copy custom nginx configuration specifying port 8080 explicitly
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy our static HTML/CSS/JS assets to the default nginx document root
COPY index.html /usr/share/nginx/html/
COPY src /usr/share/nginx/html/src/

# Expose port 8080 strictly
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
