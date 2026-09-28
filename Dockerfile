# Event ID Field Guide — served as a static file by nginx.
# The app is a single self-contained index.html (data, styles and JS are all
# embedded in it at build time by the project's own build script), so the
# image just needs a tiny static file server. No compile step required here.

FROM nginx:1.27-alpine

COPY index.html /usr/share/nginx/html/index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:80/ >/dev/null || exit 1
