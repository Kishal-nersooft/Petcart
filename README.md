# PetCart.lk

Static pet shop website built with HTML, CSS, and JavaScript.

## Project Structure

- `index.html` - Main homepage
- `shop.html` - Shop page
- `assets/css/style.css` - Styles
- `assets/js/script.js` - Frontend interactions

## Run Locally (without Docker)

Open `index.html` directly in a browser, or serve the folder with any static server.

Example with Python:

```bash
python3 -m http.server 3005
```

Then visit `http://localhost:3005`.

## Docker Deployment (Port 3005)

This repository includes:

- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`

### Build and run

```bash
docker compose up --build -d
```

### Access

Open `http://localhost:3005`

### Stop

```bash
docker compose down
```

## Push to GitHub

If this folder is not yet a git repository:

```bash
git init
git add .
git commit -m "Initial commit: PetCart.lk site with Docker setup"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

If git is already initialized:

```bash
git add .
git commit -m "Add Docker and deployment configuration"
git push
```

## Notes

- Nginx inside the container is configured to listen on port `3005`.
- Host port `3005` is mapped to container port `3005` in `docker-compose.yml`.
