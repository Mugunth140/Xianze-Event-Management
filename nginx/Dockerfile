# XIANZE Nginx - Static file server
FROM nginx:1.25-alpine

RUN rm /etc/nginx/conf.d/default.conf
RUN mkdir -p /var/www/certbot

COPY nginx.conf /etc/nginx/nginx.conf

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
