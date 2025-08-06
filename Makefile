# Commande par défaut: lance Docker Compose
all: up

# Démarre les conteneurs en arrière-plan
up:
	docker-compose up --build -d

# Arrête les conteneurs
down:
	docker-compose down

# Redémarre les conteneurs
restart: down up

# Nettoie les volumes et les réseaux associés
clean: down
	docker-compose down --volumes --remove-orphans --rmi all

fclean: clean
	docker system prune -af

.PHONY: all up down restart clean fclean