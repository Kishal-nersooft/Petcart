FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Serve the site on port 3005
RUN printf "server {\n  listen 3005;\n  server_name _;\n\n  root /usr/share/nginx/html;\n  index index.html;\n\n  location / {\n    try_files \$uri \$uri/ /index.html;\n  }\n}\n" > /etc/nginx/conf.d/default.conf

# Copy static website files
COPY . /usr/share/nginx/html

EXPOSE 3005

CMD ["nginx", "-g", "daemon off;"]
