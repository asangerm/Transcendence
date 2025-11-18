# Commande par défaut: lance Docker Compose
all: up

# Génère les certificats SSL
ssl:
	@if [ ! -f backend/ssl/cert.pem ]; then \
		mkdir -p backend/ssl frontend/ssl; \
		openssl req -x509 -newkey rsa:4096 -keyout backend/ssl/key.pem \
			-out backend/ssl/cert.pem -days 365 -nodes \
			-subj "/C=FR/ST=IDF/L=Paris/O=42/OU=Transcendence/CN=localhost" 2>/dev/null; \
		cp backend/ssl/cert.pem frontend/ssl/cert.pem; \
		cp backend/ssl/key.pem frontend/ssl/key.pem; \
	fi

# Démarre les conteneurs en arrière-plan
up: ssl
	docker compose up --build -d

# Arrête les conteneurs
down:
	docker compose down

# Redémarre les conteneurs
restart: down up

# Nettoie les volumes et les réseaux associés
clean: down
	docker compose down --volumes --remove-orphans --rmi all

fclean: clean
	docker system prune -af
	@rm -rf backend/ssl/*.pem frontend/ssl/*.pem 2>/dev/null || true

re: fclean up

.PHONY: all ssl up down restart clean fclean re