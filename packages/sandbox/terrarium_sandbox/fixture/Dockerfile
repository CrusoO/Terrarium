FROM nginx:1.27-alpine
COPY index.html /usr/share/nginx/html/index.html
EXPOSE 80
HEALTHCHECK --interval=2s --timeout=2s --start-period=2s --retries=8 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
