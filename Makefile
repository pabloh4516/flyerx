# ============================================
# Flyerx - Makefile
# ============================================

.PHONY: help build up down restart logs shell composer artisan test migrate fresh seed horizon queue cache clear install setup

# Default target
help:
	@echo "Flyerx - Available Commands:"
	@echo ""
	@echo "  Setup:"
	@echo "    make install     - First time setup (build + install dependencies)"
	@echo "    make setup       - Run migrations and seeders"
	@echo ""
	@echo "  Docker:"
	@echo "    make build       - Build Docker images"
	@echo "    make up          - Start containers"
	@echo "    make down        - Stop containers"
	@echo "    make restart     - Restart containers"
	@echo "    make logs        - View container logs"
	@echo ""
	@echo "  Development:"
	@echo "    make shell       - Access app container shell"
	@echo "    make composer    - Run composer command (use c=<command>)"
	@echo "    make artisan     - Run artisan command (use c=<command>)"
	@echo "    make test        - Run tests"
	@echo "    make test-cov    - Run tests with coverage"
	@echo ""
	@echo "  Database:"
	@echo "    make migrate     - Run migrations"
	@echo "    make fresh       - Fresh migrations + seed"
	@echo "    make seed        - Run seeders"
	@echo "    make db-shell    - Access PostgreSQL shell"
	@echo ""
	@echo "  Queue:"
	@echo "    make horizon     - Start Horizon"
	@echo "    make queue       - Process queue (single)"
	@echo ""
	@echo "  Cache:"
	@echo "    make cache       - Clear and rebuild cache"
	@echo "    make clear       - Clear all caches"

# ============================================
# Setup
# ============================================

install: build
	@docker compose run --rm app composer install
	@docker compose run --rm app cp .env.example .env
	@docker compose run --rm app php artisan key:generate
	@echo "Installation complete! Run 'make up' to start the containers."

setup:
	@docker compose exec app php artisan migrate --seed
	@docker compose exec app php artisan storage:link
	@echo "Setup complete!"

# ============================================
# Docker Commands
# ============================================

build:
	@docker compose build

up:
	@docker compose up -d
	@echo "Containers started! API available at http://localhost:8000"

down:
	@docker compose down

restart:
	@docker compose restart

logs:
	@docker compose logs -f

logs-app:
	@docker compose logs -f app

logs-horizon:
	@docker compose logs -f horizon

# ============================================
# Development
# ============================================

shell:
	@docker compose exec app sh

shell-root:
	@docker compose exec -u root app sh

composer:
	@docker compose exec app composer $(c)

artisan:
	@docker compose exec app php artisan $(c)

tinker:
	@docker compose exec app php artisan tinker

# ============================================
# Testing
# ============================================

test:
	@docker compose exec app php artisan test

test-cov:
	@docker compose exec app php artisan test --coverage

test-unit:
	@docker compose exec app php artisan test --testsuite=Unit

test-feature:
	@docker compose exec app php artisan test --testsuite=Feature

pest:
	@docker compose exec app ./vendor/bin/pest

# ============================================
# Database
# ============================================

migrate:
	@docker compose exec app php artisan migrate

migrate-status:
	@docker compose exec app php artisan migrate:status

fresh:
	@docker compose exec app php artisan migrate:fresh --seed

seed:
	@docker compose exec app php artisan db:seed

rollback:
	@docker compose exec app php artisan migrate:rollback

db-shell:
	@docker compose exec postgres psql -U flyerx -d flyerx

# ============================================
# Queue
# ============================================

horizon:
	@docker compose exec app php artisan horizon

queue:
	@docker compose exec app php artisan queue:work --tries=3

queue-failed:
	@docker compose exec app php artisan queue:failed

queue-retry:
	@docker compose exec app php artisan queue:retry all

# ============================================
# Cache
# ============================================

cache:
	@docker compose exec app php artisan config:cache
	@docker compose exec app php artisan route:cache
	@docker compose exec app php artisan view:cache
	@docker compose exec app php artisan event:cache

clear:
	@docker compose exec app php artisan config:clear
	@docker compose exec app php artisan route:clear
	@docker compose exec app php artisan view:clear
	@docker compose exec app php artisan cache:clear
	@docker compose exec app php artisan event:clear

optimize:
	@docker compose exec app php artisan optimize

# ============================================
# Code Quality
# ============================================

lint:
	@docker compose exec app ./vendor/bin/pint

lint-check:
	@docker compose exec app ./vendor/bin/pint --test

analyse:
	@docker compose exec app ./vendor/bin/phpstan analyse

# ============================================
# Documentation
# ============================================

docs:
	@docker compose exec app php artisan l5-swagger:generate
	@echo "API documentation generated! Available at http://localhost:8000/api/documentation"
