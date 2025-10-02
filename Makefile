# RH-LCT Project - Docker & Development Management

.PHONY: help up down logs dev-up dev-down dev-logs db-up db-down db-logs db-shell db-migrate db-seed db-reset clean setup check-docker install build start

# Detect Docker Compose command (docker-compose vs docker compose)
DOCKER_COMPOSE := $(shell docker compose version > /dev/null 2>&1 && echo "docker compose" || echo "docker-compose")

# Check if running on Windows (Git Bash/WSL detection)
ifeq ($(OS),Windows_NT)
    DETECTED_OS := Windows
else
    DETECTED_OS := $(shell uname -s)
endif

# Project variables
DB_SERVICE := postgres
COMPOSE_FILE := docker-compose.yml
APP_DIR := app
DB_NAME := ala_hr
DB_USER := ala_admin

# Default target
help:
	@echo "🚀 RH-LCT Project Management"
	@echo "Detected OS: $(DETECTED_OS)"
	@echo "Docker Compose: $(DOCKER_COMPOSE)"
	@echo ""
	@echo "Available commands:"
	@echo "  setup         - 🛠️  Initial project setup (first time)"
	@echo ""
	@echo "🐳 Docker Production:"
	@echo "  up            - 🚀 Start all services (app + db)"
	@echo "  down          - 🛑 Stop all services"
	@echo "  logs          - 📋 Show all logs"
	@echo ""
	@echo "Development:"
	@echo "  dev-up        - 🟢 Start development environment"
	@echo "  dev-down      - 🔴 Stop development environment" 
	@echo "  dev-logs      - 📋 Show development logs"
	@echo "  install       - 📦 Install dependencies"
	@echo "  build         - 🔨 Build application"
	@echo "  start         - ▶️  Start production server locally"
	@echo ""
	@echo "Database:"
	@echo "  db-up         - 🐘 Start database service"
	@echo "  db-down       - 🛑 Stop database service"
	@echo "  db-logs       - 📊 Show database logs"
	@echo "  db-shell      - 🐚 Connect to database shell"
	@echo "  db-migrate    - 🔄 Run database migrations"
	@echo "  db-seed       - 🌱 Seed database with test data"
	@echo "  db-reset      - ⚠️  Reset database (⚠️  destructive)"
	@echo ""
	@echo "Utilities:"
	@echo "  clean         - 🧹 Remove containers and volumes"
	@echo "  check-docker  - ✅ Check Docker availability"

# Check Docker availability
check-docker:
	@docker --version > /dev/null 2>&1 || { echo "❌ Docker is not installed or not running"; exit 1; }
	@$(DOCKER_COMPOSE) version > /dev/null 2>&1 || { echo "❌ Docker Compose is not available"; exit 1; }
	@echo "✅ Docker and Docker Compose are available"

# Docker Production environment (full stack)
up: check-docker
	@echo "🚀 Starting all services with Docker Compose..."
	@$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) up -d
	@echo "⏳ Waiting for services to be ready..."
	@sleep 10
	@echo "✅ All services are running!"
	@echo "📊 Application: http://localhost:3000"
	@echo "📊 Database:    localhost:5440"
	@$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) ps

down: check-docker
	@echo "🛑 Stopping all services..."
	@$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) down
	@echo "✅ All services stopped"

logs: check-docker
	@echo "📋 Showing logs for all services..."
	@$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) logs -f

# Development environment
dev-up: check-docker db-up
	@echo "🚀 Starting development environment..."
	@cd $(APP_DIR) && npm run dev &
	@echo "✅ Development server starting at http://localhost:3000"
	@echo "📊 Database available at localhost:5440"

dev-down: 
	@echo "🛑 Stopping development environment..."
	@pkill -f "next dev" 2>/dev/null || true
	@make db-down
	@echo "✅ Development environment stopped"

dev-logs:
	@echo "📋 Development logs:"
	@make db-logs

# Application commands
install: check-docker
	@echo "📦 Installing dependencies..."
	@cd $(APP_DIR) && npm install
	@echo "✅ Dependencies installed"

build: install
	@echo "🔨 Building application..."
	@cd $(APP_DIR) && npm run build
	@echo "✅ Application built successfully"

start: build
	@echo "▶️  Starting production server..."
	@cd $(APP_DIR) && npm start

# Database commands
db-up: check-docker
	@echo "🐘 Starting database service..."
	@$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) up -d $(DB_SERVICE)
	@echo "⏳ Waiting for database to be ready..."
	@sleep 5
	@$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) ps $(DB_SERVICE)
	@echo "✅ Database is running at localhost:5440"

db-down: check-docker
	@echo "🛑 Stopping database service..."
	@$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) down $(DB_SERVICE)

db-logs: check-docker
	@echo "📊 Database logs:"
	@$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) logs -f $(DB_SERVICE)

db-shell: check-docker
	@echo "🐚 Connecting to database shell..."
	@$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) exec $(DB_SERVICE) psql -U $(DB_USER) -d $(DB_NAME)

db-migrate: db-up
	@echo "🔄 Running database migrations..."
	@cd $(APP_DIR) && npm run db:setup
	@echo "✅ Database migrations completed"

db-seed: db-migrate
	@echo "🌱 Seeding database with test data..."
	@cd $(APP_DIR) && npm run seed
	@echo "✅ Database seeded successfully"

db-reset: check-docker
	@echo "⚠️  Resetting database (this will delete all data)..."
	@read -p "Are you sure? [y/N]: " confirm && [ "$$confirm" = "y" ] || exit 1
	@echo "🗄️  Stopping and removing database..."
	@$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) down $(DB_SERVICE)
	@docker volume rm rh-lct_postgres_data 2>/dev/null || true
	@echo "🚀 Starting fresh database..."
	@make db-seed
	@echo "✅ Database reset completed"

# Utility commands
clean: check-docker
	@echo "🧹 Cleaning up containers and volumes..."
	@$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) down -v --remove-orphans
	@docker system prune -f
	@echo "✅ Cleanup completed"

# Setup for new developers
setup: check-docker
	@echo "🛠️  Setting up RH-LCT development environment..."
	@echo "Detected OS: $(DETECTED_OS)"
	@echo "Using Docker Compose: $(DOCKER_COMPOSE)"
	@echo ""
	@echo "📦 Installing dependencies..."
	@make install
	@echo "🐘 Setting up database..."
	@make db-seed
	@echo ""
	@echo "✅ Setup complete!"
	@echo ""
	@echo "🚀 Quick start:"
	@echo "  make dev-up    - Start development"
	@echo "  make db-shell  - Access database"
	@echo "  make help      - Show all commands"
