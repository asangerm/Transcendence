// @ts-ignore
import * as Phaser from 'phaser';

// Types pour les troupes
interface SpawnRequest {
	team: string;
	troopType: string;
	castle: any;
}

// Définition des types de troupes
const walkStopRange = 30;
const TROOP_TYPES =
{
	MELEE:
	{
		key: 'melee',
		texture: 'melee',
		cost: 15,
		reward: 30,
		color: 0x55aa55,
		hp: 10,
		attack: 2.5,
		defense: 1,
		speed: 90,
		attackRange: 50,
		attackSpeed: 0.7,
		critChance: 0.15,
		critDamage: 2,
		breakDefense: 1,
		rage: 1
	},
	TANK:
	{
		key: 'tank',
		texture: 'tank',
		cost: 25,
		reward: 50,
		color: 0x8888ff,
		hp: 25,
		attack: 1,
		defense: 2.5,
		speed: 60,
		attackRange: 50,
		attackSpeed: 0.7,
		critChance: 0.05,
		critDamage: 1.2,
		breakDefense: 0.8,
		rage: 1
	},
	RANGE:
	{
		key: 'range',
		texture: 'range',
		cost: 20,
		reward: 40,
		color: 0xff8888,
		hp: 12,
		attack: 1.5,
		defense: 0.8,
		speed: 75,
		attackRange: 200,
		attackSpeed: 1,
		critChance: 0.1,
		critDamage: 1.5,
		breakDefense: 2.5,
		rage: 1
	},
	ASSASSIN:
	{
		key: 'assassin',
		texture: 'assassin',
		cost: 20,
		reward: 40,
		color: 0x8888ff,
		hp: 7,
		attack: 1.5,
		defense: 0.8,
		speed: 140,
		attackRange: 60,
		attackSpeed: 2,
		critChance: 0.15,
		critDamage: 1.5,
		breakDefense: 1.2,
		rage: 1
	},
	BERSEKER:
	{
		key: 'berserker',
		texture: 'berserker',
		cost: 20,
		reward: 40,
		color: 0x8888ff,
		hp: 12,
		attack: 1.2,
		defense: 0.5,
		speed: 100,
		attackRange: 50,
		attackSpeed: 1,
		critChance: 0.3,
		critDamage: 1.1,
		breakDefense: 1,
		rage: 1.5
	}
};

export class TroopManager
{
	scene: Phaser.Scene;
	castleLeft: any;
	castleRight: any;
	troops: Phaser.Physics.Arcade.Group;
	attackZones: Map<string, Phaser.Geom.Circle>;
	attackZoneGraphics: Map<string, Phaser.GameObjects.Graphics>;
	WalkStopZoneGraphics: Map<string, Phaser.GameObjects.Graphics>;
	lastDamageTime: Map<any, number>;
	damageDelay: number;
	spawnQueue: { [key: string]: SpawnRequest[] };
	troopCount: { [key: string]: number };
	activeBonuses: Map<string, any>;
	MILESTONES: number[];
	TROOP_BONUSES: { [key: string]: any };

	constructor(scene: Phaser.Scene, castleLeft: any, castleRight: any)
	{
		console.log('TroopManager constructor');
		this.scene = scene;
		this.castleLeft = castleLeft;
		this.castleRight = castleRight;
		this.troops = scene.physics.add.group();
		this.attackZones = new Map(); // Pour stocker les zones d'attaque
		this.attackZoneGraphics = new Map(); // Pour stocker les visualisations
		this.WalkStopZoneGraphics = new Map(); // Pour stocker les visualisations
		// Map pour suivre le dernier moment où une troupe a infligé des dégâts
		this.lastDamageTime = new Map<any, number>();
		// Délai minimum entre chaque dégât (en ms)
		this.damageDelay = 1000; // va changer
		// Système de file d'attente virtuelle
		this.spawnQueue = { left: [], right: [] };
		
		// Système de comptage des troupes par château
		this.troopCount = {
			left: {
				MELEE: 0,
				TANK: 0,
				RANGE: 0,
				ASSASSIN: 0,
				BERSEKER: 0
			},
			right: {
				MELEE: 0,
				TANK: 0,
				RANGE: 0,
				ASSASSIN: 0,
				BERSEKER: 0
			}
		} as any;

		// Définition des paliers et bonus
		this.activeBonuses = new Map<string, any>();
		this.MILESTONES = [10, 25, 50, 100];
		this.TROOP_BONUSES = {
			MELEE: {
				10: { attack: 1.25, critDamage: 1.25 },
				25: { attack: 1.5, critDamage: 1.5},
				50: { attack: 1.75, critDamage: 2},
				100: { attack: 2, critDamage: 2.5}
			},
			TANK: {
				10: { hp: 1.25, defense: 1.25 },
				25: { hp: 1.5, defense: 1.5 },
				50: { hp: 1.75, defense: 2 },
				100: { hp: 2, defense: 2.5 }
			},
			RANGE: {
				10: { attackRange: 1.25, breakDefense: 1.25 },
				25: { attackRange: 1.5, breakDefense: 1.5},
				50: { attackRange: 1.75, breakDefense: 2},
				100: { attackRange: 2, breakDefense: 2.5}
			},
			ASSASSIN: {
				10: { speed: 1.25, attackSpeed: 1.25 },
				25: { speed: 1.5, attackSpeed: 1.5},
				50: { speed: 1.75, attackSpeed: 2},
				100: { speed: 2, attackSpeed: 2.5}
			},
			BERSEKER: {
				10: { rage: 1.25, critChance: 1.25 },
				25: { rage: 1.5, critChance: 1.5},
				50: { rage: 1.75, critChance: 2},
				100: { rage: 2, critChance: 2.5}
			}
		};
	}

	public isSpawnAreaClear(team: string)
	{
		const spawnX = team === 'left' ? 128 : 1152;
		const spawnY = 630;
		const safeDistance = 65; // Distance minimale de sécurité
		// Vérifie si une troupe est trop proche du point de spawn
		return !this.troops.getChildren().some((other: any) =>
		{
			if (!other.active || (other as any).team !== team) return false;

			const distance = Phaser.Math.Distance.Between(spawnX, spawnY, (other as any).x, (other as any).y);
			
			// On vérifie si une troupe est dans la zone de sécurité
			return distance < safeDistance;
		});
	}

	public requestTroopSpawn(team: string, troopType: string, castle: any)
	{
		console.log('requestTroopSpawn', team, troopType, castle);
		// Crée une demande de spawn
		const spawnRequest =
		{
			team,
			troopType,
			castle,  // On stocke la référence au château pour déduire le coût plus tard
			cost: this.getTroopCost(troopType)
		};

		// Ajoute à la file d'attente
		this.spawnQueue[team].push(spawnRequest);

		// Si c'est la première troupe, on essaie de la spawner immédiatement
		if (this.spawnQueue[team].length === 1)
		{
			this.trySpawnNextTroop(team);
		}
	}

	public trySpawnNextTroop(team: string)
	{
		const queue = this.spawnQueue[team];
		if (queue.length === 0) return;

		// Vérifie si la zone est libre
		if (this.isSpawnAreaClear(team))
		{
			// Spawn la troupe
			const nextSpawn = queue[0];
			
			// Vérifie si le château a toujours assez d'argent
			if (nextSpawn.castle.money >= 0) // On vérifie juste que le château existe
			{
				// Crée la troupe sans déduire le coût
				this.createTroop(team, nextSpawn.troopType);
				
				// Retire la demande de la file
				queue.shift();

				// Attend 500ms avant d'essayer de spawner la prochaine troupe
				if (queue.length > 0)
				{
					this.scene.time.delayedCall(500, () => this.trySpawnNextTroop(team));
				}
			}
		}
		else
		{
			// Réessaie plus fréquemment pour être plus réactif
			this.scene.time.delayedCall(50, () => this.trySpawnNextTroop(team));
		}
	}

	public createTroop(team: string, troopType: string)
	{
		const type = (TROOP_TYPES as any)[troopType];
		const y = 720 - 90;
		const x = team === 'left' ? 64 + 64 : 1280 - 64 - 64;
		const vx = team === 'left' ? type.speed : -type.speed;
		const troop = this.scene.physics.add.sprite(x, y, type.texture) as any;

		// Incrémenter le compteur de troupes
		(this.troopCount as any)[team][troopType]++;
		
		// Appliquer les bonus basés sur les paliers
		const count = (this.troopCount as any)[team][troopType];
		const bonuses = (this.TROOP_BONUSES as any)[troopType];
		//let activeBonus = {};

		// Trouver le plus haut palier atteint
		for (const milestone of [...this.MILESTONES].reverse()) {
			if (count >= milestone && bonuses[milestone]) {
				const newBonus = bonuses[milestone];
				for (const [stat, mult] of Object.entries(newBonus)) {
					const multiplier = mult as number;
					if (!this.activeBonuses.get(team)?.[stat] || this.activeBonuses.get(team)?.[stat] < multiplier) {
						if (!this.activeBonuses.has(team)) this.activeBonuses.set(team, {});
						this.activeBonuses.get(team)[stat] = multiplier;
						this.showMilestoneEffect({ x, y }, milestone);
					}
				}
				break;
			}
		}

		// Copier les stats de base
		const stats = { ...type };

		// Appliquer les bonus
		/*for (const [stat, multiplier] of Object.entries(activeBonus)) {
			if (stats[stat]) {
				stats[stat] *= multiplier;
			}
		}*/

		for (const [stat, mult] of Object.entries(this.activeBonuses.get(team) || {})) {
			const multiplier = mult as number;
			if (stats[stat]) stats[stat] *= multiplier;
		}

		// Appliquer les stats modifiées
		if (team === 'left')
		{
			troop.setOrigin(1, 1);
		}
		else
		{
			troop.setOrigin(0, 1);
		}

		// Appliquer toutes les propriétés
		(troop as any).hp = stats.hp;
		(troop as any).attack = stats.attack;
		(troop as any).defense = stats.defense;
		(troop as any).baseSpeed = stats.speed;
		(troop as any).troopType = stats.key;
		(troop as any).attackRange = stats.attackRange;
		(troop as any).attackSpeed = stats.attackSpeed;
		(troop as any).critChance = stats.critChance;
		(troop as any).critDamage = stats.critDamage;
		(troop as any).breakDefense = stats.breakDefense;
		(troop as any).rage = stats.rage;
		(troop as any).createdAt = Date.now();
		(troop as any).facing = team;
		(troop as any).team = team;
		(troop as any).reward = stats.reward;
		// Ne plus appliquer de tint coloré, utiliser l'image originale

		const graphics = this.scene.add.graphics();
		this.attackZoneGraphics.set(troop, graphics);
		graphics.setDepth(-1);

		const walkStopGraphics = this.scene.add.graphics();
		this.WalkStopZoneGraphics.set(troop, walkStopGraphics);
		walkStopGraphics.setDepth(-1);

		troop.baseVelocityX = vx;
		troop.setVelocityX(vx);
		troop.setDepth(1);

		// Initialiser l'état d'animation
		(troop as any).lastAnimationState = true; // Commence en mouvement
		
		// Jouer l'animation de marche pour les troupes melee
		if (troopType === 'MELEE') {
			troop.play('melee-walk-left');
			// Inverser l'image pour les troupes de droite
			if (team === 'right') {
				troop.setFlipX(true);
			}
		}
		if (troopType === 'RANGE') {
			troop.play('range-walk-left');
			// Inverser l'image pour les troupes de droite
			if (team === 'right') {
				troop.setFlipX(true);
			}
		}
		if (troopType === 'TANK') {
			troop.play('tank-walk-left');
			// Inverser l'image pour les troupes de droite
			if (team === 'right') {
				troop.setFlipX(true);
			}
		}
		if (troopType === 'ASSASSIN') {
			troop.play('assassin-walk-left');
			// Inverser l'image pour les troupes de droite
			if (team === 'right') {
				troop.setFlipX(true);
			}
		}

		this.troops.add(troop);

		// Afficher un effet visuel si un palier est atteint
		if (this.MILESTONES.includes(count)) {
			this.showMilestoneEffect(troop, count);
		}

		return troop;
	}

	public getTroopCost(type: string)
	{
		return (TROOP_TYPES as any)[type]?.cost || 0;
	}

	public update()
	{
		this.troops.getChildren().forEach((troop: any) =>
		{
			if (!troop.active) return;

			// Mise à jour de la visualisation de la zone d'attaque
			const graphics = this.attackZoneGraphics.get(troop);
			if (graphics)
			{
				graphics.clear();
				graphics.lineStyle(1, 0xff0000, 0.3);
				graphics.fillStyle(0xff0000, 0.1);
				
				const groundY = troop.y;
				const groundX = troop.team === 'left' ? troop.x - troop.width / 2 : troop.x + troop.width / 2;
				
				// Dessiner le demi-cercle pour la zone d'attaque
				graphics.beginPath();
				if (troop.facing === 'left') {
					graphics.arc(groundX, groundY, troop.attackRange + troop.width / 2, 0, Math.PI, true);
				} else {
					graphics.arc(groundX, groundY, troop.attackRange + troop.width / 2, 0, Math.PI, true);
				}
				graphics.lineTo(groundX, groundY);
				graphics.closePath();
				graphics.fillPath();
				graphics.strokePath();
			}

			// Mise à jour de la visualisation de la zone d'arrêt
			const walkStopGraphics = this.WalkStopZoneGraphics.get(troop);
			if (walkStopGraphics)
			{
				walkStopGraphics.clear();
				walkStopGraphics.lineStyle(1, 0x00ff00, 0.3);
				walkStopGraphics.fillStyle(0x00ff00, 0.1);
				
				const groundY = troop.y;
				const groundX = troop.team === 'left' ? troop.x - troop.width / 2 : troop.x + troop.width / 2;
				
				// Dessiner le demi-cercle pour la zone d'arrêt
				walkStopGraphics.beginPath();
				if (troop.facing === 'left') {
					walkStopGraphics.arc(groundX, groundY, walkStopRange + troop.width / 2, 0, Math.PI, true);
				} else {
					walkStopGraphics.arc(groundX, groundY, walkStopRange + troop.width / 2, 0, Math.PI, true);
				}
				walkStopGraphics.lineTo(groundX, groundY);
				walkStopGraphics.closePath();
				walkStopGraphics.fillPath();
				walkStopGraphics.strokePath();
			}

			// Vérifier les autres troupes et les châteaux pour la zone d'arrêt et d'attaque
			let hasTargetInWalkStopRange = false;
			let hasEnemyInWalkStopRange = false;
			let frontTroopIsMoving = true; // Par défaut, on considère qu'on peut bouger

			// Vérification des troupes
			this.troops.getChildren().forEach((otherTroop: any) =>
			{
				if (troop !== otherTroop && (otherTroop as any).active)
				{
					if (this.isInRange(troop, otherTroop, walkStopRange))
					{
						hasTargetInWalkStopRange = true;
						// Ne s'arrêter que devant des ennemis, pas des alliés
						if ((troop as any).team !== (otherTroop as any).team)
						{
							hasEnemyInWalkStopRange = true;
						}
						else
						{
							// Si c'est un allié devant nous, vérifier s'il bouge
							frontTroopIsMoving = Math.abs(otherTroop.body.velocity.x) > 1;
						}
					}
					if (this.isInRange(troop, otherTroop, (troop as any).attackRange))
					{
						// Si c'est un ennemi, on l'attaque
						if ((troop as any).team !== (otherTroop as any).team)
						{
							const currentTime = Date.now();
							const lastTime = this.lastDamageTime.get(troop) || 0;
							if (currentTime - lastTime >= this.damageDelay / (troop as any).attackSpeed)
							{
								this.damage(troop, otherTroop);
								this.lastDamageTime.set(troop, currentTime);
							}
						}
					}
				}
			});

			// Vérification des châteaux
			const targetCastle = troop.team === 'left' ? this.castleRight : this.castleLeft;
			if (this.isInRangeCastle(troop, targetCastle, walkStopRange))
			{
				hasTargetInWalkStopRange = true;
				hasEnemyInWalkStopRange = true; // Les châteaux sont toujours des ennemis
			}
			if (this.isInRangeCastle(troop, targetCastle, troop.attackRange))
			{
				// Attaque du château
				const currentTime = Date.now();
				const lastTime = this.lastDamageTime.get(troop) || 0;

				if (currentTime - lastTime >= this.damageDelay / troop.attackSpeed)
				{
					let damage = troop.attack;
		
					// Calcul du bonus de rage basé sur le temps en vie
					const timeAlive = (Date.now() - troop.createdAt) / 1000;
					const rageBonus = troop.rage > 1 ? 1 + (timeAlive / 5) * (troop.rage - 1) : 1;
					damage *= rageBonus;

					if (Math.random() < troop.critChance)
					{
						damage *= troop.critDamage;
						this.showCritEffect(targetCastle);
					}

					targetCastle.health -= damage;
					this.showDamageEffect(targetCastle, troop, Math.round(damage));
					this.lastDamageTime.set(troop, currentTime);
				}
			}

			// Gérer le mouvement - s'arrêter devant toute cible (allié ou ennemi) pour la file indienne
			if (hasTargetInWalkStopRange)
			{
				troop.setVelocityX(0);
			}
			else if ((troop as any).hp > 0)
			{
				// Si la troupe n'est pas bloquée et est en vie, elle doit avancer
				const dir = (troop as any).team === 'left' ? 1 : -1;
				troop.setVelocityX(dir * (troop as any).baseSpeed);
			}

			// Gérer l'animation basée sur l'intention de mouvement
			// Si bloquée par un ennemi OU si la troupe de devant ne bouge pas, passer en idle
			const isMoving = !hasEnemyInWalkStopRange && frontTroopIsMoving && (troop as any).hp > 0;
			this.updateTroopAnimation(troop, isMoving);
		});
	}

	private updateTroopAnimation(troop: any, isMoving: boolean)
	{
		const troopType = (troop as any).troopType;
		const team = (troop as any).team;
		
		// Ne changer l'animation que si l'état a changé
		if ((troop as any).lastAnimationState === isMoving) {
			return;
		}
		
		(troop as any).lastAnimationState = isMoving;
		
		console.log('updateTroopAnimation:', { troopType, team, isMoving });
		
		if (troopType === 'melee') {
			if (isMoving) {
				const animationKey = team === 'left' ? 'melee-walk-left' : 'melee-walk-right';
				troop.play(animationKey);
			} else {
				const animationKey = team === 'left' ? 'melee-idle-left' : 'melee-idle-right';
				troop.play(animationKey);
			}
		} else if (troopType === 'range') {
			if (isMoving) {
				const animationKey = team === 'left' ? 'range-walk-left' : 'range-walk-right';
				troop.play(animationKey);
			} else {
				const animationKey = team === 'left' ? 'range-idle-left' : 'range-idle-right';
				troop.play(animationKey);
			}
		} else if (troopType === 'tank') {
			if (isMoving) {
				const animationKey = team === 'left' ? 'tank-walk-left' : 'tank-walk-right';
				troop.play(animationKey);
			} else {
				const animationKey = team === 'left' ? 'tank-idle-left' : 'tank-idle-right';
				troop.play(animationKey);
			}
		} else if (troopType === 'assassin') {
			if (isMoving) {
				const animationKey = team === 'left' ? 'assassin-walk-left' : 'assassin-walk-right';
				troop.play(animationKey);
			} else {
				const animationKey = team === 'left' ? 'assassin-idle-left' : 'assassin-idle-right';
				troop.play(animationKey);
			}
		}
	}

	public isInRange(attacker: any, target: any, range?: number)
	{
		// Position du centre de l'attaquant et de la cible
		const targetCenter =
		{
			x: target.x,
			y: target.y
		};
		if (attacker.team === target.team)
		{
			if (attacker.team === 'left')
			{
				targetCenter.x = target.x - target.body.width;
			}
			else
			{
				targetCenter.x = target.x + target.body.width;
			}
		}
		const attackerCenter =
		{
			x: attacker.x,
			y: attacker.y
		};

		// Calculer la distance entre les deux troupes
		const distance = Phaser.Math.Distance.Between(
			attackerCenter.x,
			attackerCenter.y,
			targetCenter.x,
			targetCenter.y
		);

		// Si la distance est supérieure à la portée, pas besoin de vérifier l'angle
		if (distance > (range || 0))
		{
			return false;
		}

		// Calculer l'angle entre l'attaquant et la cible
		let angle = Phaser.Math.Angle.Between(
			attackerCenter.x,
			attackerCenter.y,
			targetCenter.x,
			targetCenter.y
		);

		// Convertir en degrés et normaliser entre 0 et 360
		let degrees = Phaser.Math.RadToDeg(angle);
		if (degrees < 0) degrees += 360;

		// Vérifier si la cible est dans le bon secteur selon la direction
		if (attacker.facing === 'left')
		{
			return (degrees >= 270 || degrees <= 90);
		}
		else
		{
			return (degrees >= 90 && degrees <= 270);
		}
	}

	public isInRangeCastle(attacker: any, castle: any, range?: number)
	{
		const attackerCenter =
		{
			x: attacker.x,
			y: attacker.y
		};

		const castleCenter =
		{
			x: castle.x + (attacker.team === 'left' ? -castle.body.width : castle.body.width),
			y: castle.y
		};

		// Calculer la distance entre l'attaquant et le château
		const distance = Phaser.Math.Distance.Between(
			attackerCenter.x,
			attackerCenter.y,
			castleCenter.x,
			castleCenter.y
		);

		// Si la distance est supérieure à la portée, pas besoin de vérifier l'angle
		if (distance > (range || 0))
		{
			return false;
		}

		// Calculer l'angle entre l'attaquant et le château
		let angle = Phaser.Math.Angle.Between(
			attackerCenter.x,
			attackerCenter.y,
			castleCenter.x,
			castleCenter.y
		);

		// Convertir en degrés et normaliser entre 0 et 360
		let degrees = Phaser.Math.RadToDeg(angle);
		if (degrees < 0) degrees += 360;

		// Vérifier si le château est dans le bon secteur selon la direction
		if (attacker.facing === 'left')
		{
			return (degrees >= 270 || degrees <= 90);
		}
		else
		{
			return (degrees >= 90 && degrees <= 270);
		}
	}

	public showDamageEffect(troop: any, _attacker: any, damage: any)
	{
		// Calculer la position X en fonction de l'équipe
		let textX = troop.x;
		if ((troop as any).team === 'left') {
			textX -= troop.width / 2;
		} else {
			textX += (troop as any).width / 2;
		}

		// Créer le texte de dégâts
		const damageText = this.scene.add.text(textX, troop.y - 50, `-${damage}`, {
			fontSize: '16px',
			fontFamily: 'Arial',
			color: '#ff0000',
			stroke: '#000000',
			strokeThickness: 4
		}).setOrigin(0.5);

		// Animation du texte
		this.scene.tweens.add({
			targets: damageText,
			y: damageText.y - 30,
			alpha: 0,
			duration: 800,
			ease: 'Power2',
			onComplete: () => {
				damageText.destroy();
			}
		});
	}

	public showCritEffect(troop: any)
	{
		// Calculer la position X en fonction de l'équipe
		let textX = troop.x;
		if ((troop as any).team === 'left') {
			textX -= troop.width / 2;
		} else {
			textX += (troop as any).width / 2;
		}

		const critText = this.scene.add.text(textX, troop.y - 70, `CRIT!`, {
			fontSize: '16px',
			fontFamily: 'Arial',
			color: '#ff9900',
		}).setOrigin(0.5);
		this.scene.tweens.add({
			targets: critText,
			y: critText.y - 30,
			alpha: 0,
			duration: 800,
			ease: 'Power2',
			onComplete: () => {
				critText.destroy();
			}
		});
	}

	public damage(attacker: any, target: any)
	{
		let damage = attacker.attack;
		
		// Calcul du bonus de rage basé sur le temps en vie
		const timeAlive = (Date.now() - attacker.createdAt) / 1000; // Temps en secondes
		const rageBonus = attacker.rage > 1 ? 1 + (timeAlive / 5) * (attacker.rage - 1) : 1; // Bonus uniquement si rage > 1
		damage *= rageBonus;

		if (Math.random() < attacker.critChance)
		{
			damage *= attacker.critDamage;
			this.showCritEffect(target);
		}
		let def = target.defense / attacker.breakDefense;
		def = def >= 1 ? def : 1;
		damage /= def;
		target.hp -= damage;
		this.showDamageEffect(target, attacker, Math.round(damage));

		if (target.hp <= 0)
		{
			// Attribuer la récompense au château correspondant
			const castle = attacker.team === 'left' ? this.castleLeft : this.castleRight;
			castle.money += target.reward;

			const graphics = this.attackZoneGraphics.get(target);
			const walkStopZoneGraphics = this.WalkStopZoneGraphics.get(target);
			if (graphics)
			{
				graphics.destroy();
				this.attackZoneGraphics.delete(target);
			}
			if (walkStopZoneGraphics)
			{
				walkStopZoneGraphics.destroy();
				this.WalkStopZoneGraphics.delete(target);
			}
			target.destroy();
		}
	}

	public showMilestoneEffect(troop: any, milestone: any)
	{
		const text = this.scene.add.text(troop.x, troop.y - 50, `Palier ${milestone} !`, {
			fontSize: '24px',
			color: '#FFD700',
			stroke: '#000',
			strokeThickness: 4
		});
		text.setOrigin(0.5);

		// Animation de l'effet
		this.scene.tweens.add({
			targets: text,
			y: text.y - 50,
			alpha: 0,
			duration: 2000,
			ease: 'Power2',
			onComplete: () => text.destroy()
		});
	}
}