

function CollisionEntityTag(game) {}



function CircularCollisionSystem(game) {
	Entity.call(this, game);
}
CircularCollisionSystem.prototype = Object.create(Entity.prototype);
CircularCollisionSystem.prototype.class_name = 'CircularCollisionSystem';
CircularCollisionSystem.prototype.update = function(game) {
	Entity.prototype.update.call(this, game);
	var collision_entities = game.query_entities_by_tag(Entity, CollisionEntityTag);

	// var terrain_grid = game.game_systems.terrain_grid;

	// for (var i = 0; i < collision_entities.length; i++) {
	// 	var ent = collision_entities[i];

	// 	if (ent.sx !== 0) {
	// 		var dx = ent.sx;
	// 		dx = this.check_terrain_move_x(terrain_grid, ent, dx);
	// 		// if (dx !== 0)
	// 		// 	dx = this.check_entities_move_x(collision_entities, ent, dx);
	// 		ent.px += dx;
	// 	}
	// 	if (ent.sy !== 0) {
	// 		var dy = ent.sy;
	// 		dy = this.check_terrain_move_y(terrain_grid, ent, dy);
	// 		// if (dy !== 0)
	// 		// 	dy = this.check_entities_move_y(collision_entities, ent, dy);
	// 		ent.py += dy;
	// 		// ent.py += this.check_terrain_move_y(terrain_grid, ent, ent.sy);
	// 	}
	// }

	for (var i = 0; i < collision_entities.length; i++) {
		var ent = collision_entities[i];

		for (var k = 0; k < ent.collision_map.length; k++) {
			// console.log("debug: ", ent.collision_radius + ent.collision_map[k].class.prototype.collision_radius);
			var collision_option = ent.collision_map[k];
			var colliding;
			if (collision_option.rectangular_collision) {
				colliding = game.find_colliding_rectangular(ent, collision_option.class);
			} else if (collision_option.container_class) {
				colliding = game.find_colliding_circular_nested(ent, collision_option.container_class, collision_option.class, ent.collision_radius);
			} else {
				colliding = game.find_colliding_circular(ent, collision_option.class, ent.collision_radius);
			}

			for (var m = 0; m < colliding.length; m++) {
				ent[collision_option.callback](game, colliding[m]);
			}
		}
	}
};



function ScrollingParticleBackground(game, config) {
	ParticleEffectSystem.call(this, game, config);
	this.particle_spawn_count = config.particle_spawn_count || 1;
	this.particle_spawn_density = config.particle_spawn_count || 0.5;
	this.particle_min_speed = config.particle_min_speed || 0.1;
	this.particle_speed = config.particle_speed || 1;

	this.particle_edge_offset = 20;

	this.init_particles(game);
}
ScrollingParticleBackground.prototype = Object.create(ParticleEffectSystem.prototype);
ScrollingParticleBackground.prototype.constructor = ScrollingParticleBackground;
ScrollingParticleBackground.prototype.update = function(game) {
	ParticleEffectSystem.prototype.update.call(this, game);

	for (var i = 0; i < this.particle_spawn_count; i++) {
		if (Math.random() < this.particle_spawn_density) {
			var particle = this.add_particle(Math.random() * (game.canvas.width + this.particle_edge_offset * 2) - this.particle_edge_offset,
					-this.particle_edge_offset, 0);
			particle.sy = this.particle_min_speed + (Math.random() * this.particle_speed) ** 2;
		}
	}

	if (this.particles.length === 40) {
		// console.log('debug:', this.particles);
		
	}
	// console.log('debug:', this.particles.length);
	for (var i = this.particles.length - 1; i >= 0; i--) {
		if (this.particles[i].py >= game.canvas.height + this.particle_edge_offset) {
			this.particles.splice(i, 1);
		}
	}
};


ScrollingParticleBackground.prototype.init_particles = function(game) {
	for (var y = -this.particle_edge_offset; y < game.canvas.height + this.particle_edge_offset; y++) {
		for (var i = 0; i < this.particle_spawn_count; i++) {
			if (Math.random() < this.particle_spawn_density) {
				var particle = this.add_particle(Math.random() * (game.canvas.width + this.particle_edge_offset * 2) - this.particle_edge_offset,
						y, 0);
				particle.sy = this.particle_min_speed + (Math.random() * this.particle_speed) ** 2;
			}
		}
	}
};






function EnemyBullet(game, px, py, path, image) {
	image = image || game.images.orange_round_bullet;
	PathEntity.call(this, game, px, py, 16, 16, image, path);

	this.angle_granularity = 5;
}
EnemyBullet.prototype = Object.create(PathEntity.prototype);
EnemyBullet.prototype.collision_radius = 6;

function PlayerBullet(game, px, py, path, image) {
	image = image || game.images.orange_round_bullet;
	PathEntity.call(this, game, px, py, 32, 32, image, path);

	this.angle_granularity = 5;

	this.entity_tags.push(new CollisionEntityTag());
}
PlayerBullet.prototype = Object.create(PathEntity.prototype);
PlayerBullet.prototype.collision_radius = 5;
PlayerBullet.prototype.collision_map = [
	{
		class: EnemyEntity,
		callback: 'hit_enemy',
	},
	{
		class: EnemyEntity,
		container_class: EnemyContainerEntity,
		callback: 'hit_enemy',
	},
];
PlayerBullet.prototype.hit_enemy = function(game, enemy) {
	enemy.take_damage(game, 5);
	game.entities_to_remove.push(this);
	game.particle_systems.red_particles.add_particle(this.px, this.py, 3);
};

function PlayerMissile(game, px, py, path) {
	PathEntity.call(this, game, px, py, 32, 10, game.images.fighter_missile, path);
	this.angle_granularity = 5;
	this.entity_tags.push(new CollisionEntityTag());
}
PlayerMissile.prototype = Object.create(PathEntity.prototype);
PlayerMissile.prototype.collision_radius = 16;
PlayerMissile.prototype.collision_map = [
	{
		class: EnemyEntity,
		callback: 'hit_enemy',
	},
	{
		class: EnemyEntity,
		container_class: EnemyContainerEntity,
		callback: 'hit_enemy',
	},
];
PlayerMissile.prototype.update = function(game) {
	PathEntity.prototype.update.call(this, game);
	var self = this;

	// find enemies and sort by distance
	var enemies = game.query_entities(EnemyEntity).concat(game.query_entities(EnemyContainerEntity));
	enemies.sort(function (a, b) { return points_dist(self, a) - points_dist(self, b); });

	// target closest enemy
	var target = enemies[0];
	if (target) {
		// find target angle
		var angle = point_angle(this.px, this.py, target.px, target.py);
		// this.angle %= 360;
		// find angle difference
		var diff = this.angle - angle;
		if (diff > 180)
			diff -= 360;
		else if (diff < -180)
			diff += 360;

		// clamp to +/- 15 delta
		if (diff > 15)
			diff = 15;
		else if (diff < -15)
			diff = -15;
		// console.log("debug:", this.angle, angle, diff);

		this.path[this.path_index - 1].da = -diff;
	} else {
		this.path[this.path_index - 1].da = 0;
	}
};
PlayerMissile.prototype.hit_enemy = function(game, enemy) {
	enemy.take_damage(game, 25);
	game.entities_to_remove.push(this);
	for (var i = 0; i < 5; i++) {
		game.particle_systems.red_particles.add_particle(this.px, this.py, 5);
	}
};





function EnemyEntity(game, px, py, width, height, image, path) {
	PathEntity.call(this, game, px, py, width, height, image, path);
	this.health = 250;
	this.armor = 0;
	this.dead = false;
}
EnemyEntity.prototype = Object.create(PathEntity.prototype);
// EnemyEntity.prototype.collision_map = [
// 	{
// 		class: PlayerBullet,
// 		callback: 'hit_bullet',
// 	},
// ];

// EnemyEntity.prototype.update = function(game) {
// 	PathEntity.prototype.update.call(this, game);

// 	var colliding_bullets = game.find_near(this, PlayerBullet, this.collision_radius);
// 	for (var i = 0; i < colliding_bullets.length; i++) {
// 		this.take_damage(game, 5);
// 		game.entities_to_remove.push(colliding_bullets[i]);
// 		// if (Math.random() < 0.3)
// 			game.particle_systems.red_particles.add_particle(colliding_bullets[i].px, colliding_bullets[i].py, 3);
// 	}
// };
// EnemyEntity.prototype.hit_bullet = function(game, bullet) {
// 	this.take_damage(game, 5);
// 	game.entities_to_remove.push(bullet);
// 	game.particle_systems.red_particles.add_particle(bullet.px, bullet.py, 3);
// };
EnemyEntity.prototype.take_damage = function(game, damage) {
	this.health -= damage - (damage * this.armor);
	if (this.health <= 0 && !this.dead) {
		this.dead = true;
		this.on_death(game);
		this.parent.remove_entity(this);
	}
};
EnemyEntity.prototype.on_death = function(game) {

	var p = { px: this.px, py: this.py };
	if (this.parent instanceof EnemyContainerEntity) {
		p = this.parent.get_global_position(this);
	}

	var count = 24 + Math.random() * 32;
	for (var i = 0; i < count; i++) {
		var offsetx = (Math.random() * this.width - (this.width / 2)) / 1.5;
		var offsety = (Math.random() * this.height - (this.height / 2)) / 1.5;
		game.particle_systems.explosion_particles.add_particle(p.px + offsetx, p.py + offsety, 2);
	}
	var count = Math.floor(2 + Math.random() * 2);
	for (var i = 0; i < count; i++) {
		game.particle_systems.ship_chunks.add_image_particle(this.image, this.width, this.height, p.px, p.py, 3);
	}

	for (var i = 0; i < this.sub_entities.length; i++) {
		if (this.sub_entities[i] instanceof EnemyEntity) {
			this.sub_entities[i].on_death(game);
		}
	}
};


function EnemyContainerEntity(game, px, py, width, height, image, path) {
	EnemyEntity.call(this, game, px, py, width, height, image, path);
}
EnemyContainerEntity.prototype = Object.create(EnemyEntity.prototype);
EnemyContainerEntity.prototype.get_global_position = function(pxy_angle) {
	var offset = d2_point_offset(this.angle, pxy_angle.px, pxy_angle.py);

	return {
		px: this.px + offset.px,
		py: this.py + offset.py,
		angle: this.angle + pxy_angle.angle,
	}
};


function UFOEnemy(game, px, py, path) {
	EnemyEntity.call(this, game, px, py, 64, 64, game.images.ufo, path);
	this.health = 250;
	this.rotation = 1;
}
UFOEnemy.prototype = Object.create(EnemyEntity.prototype);
UFOEnemy.prototype.collision_radius = 32;

UFOEnemy.prototype.fire = function(game, tx, ty) {
	// var target_angle = point_angle(this.px, this.py, tx, ty);
	// for (var d = -120; d <= 120; d += 60) {
	// 	var offset = point_offset(target_angle + 90, d);
		
	// 	var path = [
	// 		{ timeout: 30, px: this.px + offset.px, py: this.py + offset.py, },
	// 		{ timeout: 30, },
	// 		{ timeout: 30, repeat: 4,
	// 			spawn: [{ path: [{timeout: 360, speed: 2, angle: target_angle}, {delete: true}] }],
	// 		},
	// 		{delete: true},
	// 	];

	// 	game.entities_to_add.push(new EnemyBullet(game, this.px, this.py, path));
	// }

	var target_angle = point_angle(this.px, this.py, tx, ty);
	// console.log("angle: ", target_angle / Math.PI * 180);

	// var sx = Math.cos(target_angle) * 2;
	// var sy = Math.sin(target_angle) * 2;

	for (var a = 0; a < 360; a += 30) {
		var bx = Math.cos(a / 180 * Math.PI) * 40;
		var by = Math.sin(a / 180 * Math.PI) * 40;

		var path = [
			{ timeout: 30, px: this.px + bx, py: this.py + by, },
			{ timeout: 30, },
			{ timeout: 360, angle: target_angle, speed: 2 },
			// { sx: sx, sy: sy, },
			{ delete: true, },
		];
		game.entities_to_add.push(new EnemyBullet(game, this.px, this.py, path));
	}
};





function UFOPlatformSection(game, px, py) {
	EnemyEntity.call(this, game, px, py, 64, 64, game.images.platform_sections);
	this.frame = Math.floor(Math.random() * 4);
	this.max_frame = 4;
	this.angle = 90 * Math.floor(Math.random() * 4);
	// this.angle = Math.random() * 360;
}
UFOPlatformSection.prototype = Object.create(EnemyEntity.prototype);
UFOPlatformSection.prototype.collision_radius = 32;
UFOPlatformSection.prototype.z_index = -1;

function UFOPlatform(game, px, py, path) {
	EnemyContainerEntity.call(this, game, px, py, 64, 64, game.images.platform_core, path);

	// this.sections = [];

	var section_count = Math.floor(Math.random() * 3) + 3;

	for (var i = 0; i < section_count; i++) {
		var offset = point_offset(i * (360 / section_count) + Math.random() * (360 / section_count), 48);

		this.add_entity(new UFOPlatformSection(game, offset.px, offset.py));
		// this.sections.push(new UFOPlatformSection(game, offset.px, offset.py));
	}

	this.rotation = 0.25 * (Math.floor(Math.random() * 5) - 2);
	this.angle = Math.random() * 360;
}
UFOPlatform.prototype = Object.create(EnemyContainerEntity.prototype);
UFOPlatform.prototype.collision_radius = 32;
UFOPlatform.prototype.update = function(game) {
	EnemyContainerEntity.prototype.update.call(this, game);

	if (this.firing > 0)
		this.spawn_bullets(game);
};
// UFOPlatform.prototype.draw = function(ctx) {
// 	ctx.save();

// 	ctx.translate(this.px, this.py);
// 	ctx.rotate(Math.PI * (Math.floor(this.angle / 15) * 15) / 180);

// 	for (var i = 0; i < this.sections.length; i++) {
// 		this.sections[i].draw(ctx);
// 	}
// 	ctx.drawImage(this.image,
// 		this.frame * this.width, 0, this.image.width, this.image.height,
// 		0 - this.width / 2, 0 - this.height / 2, this.width, this.height);

// 	ctx.restore();
// };

UFOPlatform.prototype.spawn_bullets = function(game) {
	this.firing--;

	var target_angle = point_angle(this.px, this.py, this.fire_target.px, this.fire_target.py);
	// slightly randomize target aim by +/- 4 degrees
	target_angle += (Math.floor(Math.random() * 101) - 50) / 50 * 4;

	// // spawn linear bullet
	// game.entities_to_add.push(new EnemyBullet(game, this.px, this.py, [
	// 	{ timeout: 240, angle: target_angle, speed: 2 + Math.random() },
	// ], game.images.bright_purple_square_bullet));

	// prepare burst spawn
	var spawn_burst = [];
	for (var i = 0; i < 360 / 45; i++) {
		spawn_burst.push({ image: game.images.bright_purple_square_bullet, path: [{ timeout: 120, angle: target_angle + i * 45, speed: 1 }] });
	}

	// spawn flak bullet
	if (Math.random() < 0.1) {
		game.entities_to_add.push(new EnemyBullet(game, this.px, this.py, [
			{ trail: { type: 'purple_particles', thickness: 0.01 }, timeout: 120, angle: target_angle, speed: 1.5 + Math.random() * 2 },
			{ spawn: spawn_burst, delete: true },
		], game.images.purple_square_bullet));
	}
};
UFOPlatform.prototype.fire = function(game, tx, ty) {
	this.firing = 40;
	this.fire_target = { px: tx, py: ty };

	this.spawn_bullets(game);
};




function Asteroid(game, px, py, size, path) {
	EnemyEntity.call(this, game, px, py, Math.floor(size * 64), Math.floor(size * 64), game.images.asteroid_64, path);
	this.health = 100;
	this.size = Math.floor(size * 64);
	this.angle = Math.random() * 360;
	this.rotation = Math.random() * 2 - 1;
}
Asteroid.prototype = Object.create(EnemyEntity.prototype);
Asteroid.prototype.collision_radius = 32;



function UFOStation(game, px, py, path) {
	EnemyContainerEntity.call(this, game, px, py, 64, 64, game.images.ufo_station_core, path);

	// this.rotation = 0.25;
	this.angle_granularity = 5;
	this.angle_offset = 0;

	this.outer_ring = [];
	var pylon_distance = 32;
	var section_count = 6;
	for (var i = 0; i < section_count; i++) {
		var offset = point_offset(i * (360 / section_count), pylon_distance);
		var pylon = new EnemyEntity(game, offset.px, offset.py, 64, 64, game.images.ufo_station_pylon2);
		pylon.collision_radius = 20;
		pylon.angle_granularity = 5;
		pylon.z_index = -1;
		pylon.angle = i * (360 / section_count);
		this.outer_ring.push(pylon);
		this.add_entity(pylon);
	}

	this.inner_ring = [];
	var pylon_distance = 24;
	var section_count = 6;
	for (var i = 0; i < section_count; i++) {
		var offset = point_offset(i * (360 / section_count), pylon_distance);
		var pylon = new EnemyEntity(game, offset.px, offset.py, 64, 64, game.images.ufo_station_pylon2);
		pylon.collision_radius = 20;
		pylon.angle_granularity = 5;
		pylon.z_index = -1;
		pylon.angle = i * (360 / section_count);
		this.inner_ring.push(pylon);
		this.add_entity(pylon);
	}

	// this.sub_entities.push(new UFOStationRing(game, 0, 0, -0.25, 32));
	// this.sub_entities.push(new UFOStationRing(game, 0, 0, 0.25, 24));
}
UFOStation.prototype = Object.create(EnemyContainerEntity.prototype);
UFOStation.prototype.collision_radius = 16;
UFOStation.prototype.update = function(game) {
	EnemyContainerEntity.prototype.update.call(this, game);
	if (this.firing > 0)
		this.spawn_bullets(game);

	this.angle_offset = (this.angle_offset + 0.25) % 360;

	var pylon_distance = 32;
	var section_count = 6;
	for (var i = 0; i < section_count; i++) {
		var angle = Math.floor((this.angle_offset + i * (360 / section_count)) / this.angle_granularity) * this.angle_granularity;
		var offset = point_offset(angle, pylon_distance);
		this.outer_ring[i].px = offset.px;
		this.outer_ring[i].py = offset.py;
		this.outer_ring[i].angle = angle;
	}

	var pylon_distance = 24;
	var section_count = 6;
	for (var i = 0; i < section_count; i++) {
		var angle = Math.floor((-this.angle_offset + i * (360 / section_count)) / this.angle_granularity) * this.angle_granularity;
		var offset = point_offset(angle, pylon_distance);
		this.inner_ring[i].px = offset.px;
		this.inner_ring[i].py = offset.py;
		this.inner_ring[i].angle = angle;
	}

	// for (var i = 0; i < section_count; i++) {
	// 	var offset = point_offset(i * (360 / section_count), pylon_distance);
	// 	var pylon = new ScreenEntity(game, offset.px, offset.py, 64, 64, game.images.ufo_station_pylon2);
	// 	pylon.angle = i * (360 / section_count);
	// 	this.outer_ring.push(pylon);
	// 	this.sub_entities.push(pylon);
	// }
};

UFOStation.prototype.spawn_bullets = function(game) {
	// spread triangle fire
	if (this.firing % 15 === 0) {
		var target_angle = point_angle(this.px, this.py, this.fire_target.px, this.fire_target.py);
		// determine spread for this tick
		var spread = (135 - this.firing) / 15;

		// fire bullets in a spread
		for (var i = -spread; i <= spread; i += 2) {
			game.entities_to_add.push(new EnemyBullet(game, this.px, this.py, [
				{ timeout: 240, angle: target_angle + i * 5, speed: 2 }
			]));
		}
	}

	// // focused bar fire
	// if (this.firing % 45 === 0) {
	// 	var target_angle = point_angle(this.px, this.py, this.fire_target.px, this.fire_target.py);

	// 	// fire bullets in a spread
	// 	for (var i = -2; i <= 2; i++) {
	// 		// game.entities_to_add.push(new EnemyBullet(game, this.px, this.py, [
	// 		// 	{ timeout: 240, angle: target_angle + i * 5, speed: 2 }
	// 		// ], game.images.bright_purple_square_bullet));
	// 		// game.entities_to_add.push(new EnemyBullet(game, this.px, this.py, [
	// 		// 	{ timeout: 240, angle: target_angle + i * 5, speed: 3 }
	// 		// ], game.images.bright_purple_square_bullet));
	// 		game.entities_to_add.push(new EnemyBullet(game, this.px, this.py, [
	// 			{ timeout: 240, angle: target_angle + i * 5, speed: 2 }
	// 		], game.images.bright_purple_square_bullet));
	// 	}
	// }

	this.firing--;
};
UFOStation.prototype.fire = function(game, tx, ty) {
	this.firing = 135;
	this.fire_target = { px: tx, py: ty };

	this.spawn_bullets(game);
};

function UFOStationRing(game, px, py, rotation, pylon_distance) {
	ScreenEntity.call(this, game, px, py, 0, 0, game.images.purple_crystal);
	this.angle = 0;
	this.rotation = rotation;
	this.angle_granularity = 5;

	var section_count = 6;
	for (var i = 0; i < section_count; i++) {
		var offset = point_offset(i * (360 / section_count), pylon_distance);
		var pylon = new ScreenEntity(game, offset.px, offset.py, 64, 64, game.images.ufo_station_pylon2);
		pylon.angle = i * (360 / section_count);
		this.sub_entities.push(pylon);
	}
}
UFOStationRing.prototype = Object.create(ScreenEntity.prototype);
UFOStationRing.prototype.z_index = -1;


function RotatingCrystalEntity(game, px, py) {
	ScreenEntity.call(this, game, px, py, 16, 16, game.images.purple_crystal);
	this.angle = 0;
	this.rotation = 1;
}
RotatingCrystalEntity.prototype = Object.create(ScreenEntity.prototype);

function UFOCorsairEnemy(game, px, py, path) {
	EnemyEntity.call(this, game, px, py, 128, 64, game.images.ufo_corsair, path);
	this.sub_entities = [ new RotatingCrystalEntity(game, this.width / 4, 0) ];
	// this.crystal_ent = new RotatingCrystalEntity(game, this.width / 4, 0);
	this.angle = 0;

	this.fire_timer = 30 * 5;

	this.health = 500;
}
UFOCorsairEnemy.prototype = Object.create(EnemyEntity.prototype);
UFOCorsairEnemy.prototype.collision_radius = 32;
// UFOCorsairEnemy.prototype.update = function(game) {
// 	EnemyEntity.prototype.update.call(this, game);
// 	this.crystal_ent.update(game);

// 	// this.fire_timer--;
// 	// if (this.fire_timer <= 0) {
// 	// 	this.fire(game);
// 	// 	this.fire_timer = 30 * 5;
// 	// }

// 	// if (Math.random() > 0.8) {
// 	// 	var offset = point_offset(this.angle, 32);
// 	// 	game.particle_systems.purple_particles.add_particle(this.px + offset.px, this.py + offset.py, 2)
// 	// }
// };
// UFOCorsairEnemy.prototype.draw = function(ctx) {
// 	ctx.save();

// 	ctx.translate(this.px, this.py);
// 	ctx.rotate(Math.PI * (Math.floor(this.angle / 15) * 15) / 180);
// 	ctx.drawImage(this.image, 0 - this.width / 2, 0 - this.height / 2, this.width, this.height);

// 	this.crystal_ent.draw(ctx);

// 	ctx.restore();
// };
UFOCorsairEnemy.prototype.fire = function(game) {
	var offset = point_offset(this.angle, this.width / 4);

	for (var da = 0.25; da < 2; da += 0.5) {
		game.entities_to_add.push(new EnemyBullet(game, this.px + offset.px, this.py + offset.py, [
			{ timeout: -1, angle: this.angle },
			{
				timeout: 20, repeat: 8,
				spawn: [{
					image: game.images.bright_purple_square_bullet,
					path: [{timeout: 90, trail: { type: 'purple_particles', thickness: 0.01 }, }, {delete: true}],
				}],
				trail: { type: 'purple_particles', thickness: 0.03 },
				speed: 3, da: da
			},
		], game.images.purple_square_bullet));
		game.entities_to_add.push(new EnemyBullet(game, this.px + offset.px, this.py + offset.py, [
			{ timeout: -1, angle: this.angle },
			{
				timeout: 20, repeat: 8,
				spawn: [{
					image: game.images.bright_purple_square_bullet,
					path: [{timeout: 90, trail: { type: 'purple_particles', thickness: 0.01 }, }, {delete: true}],
				}],
				trail: { type: 'purple_particles', thickness: 0.03 },
				speed: 3, da: -da
			},
		], game.images.purple_square_bullet));
		
	}
};

function UFOCorvetteEnemy(game, px, py, path) {
	EnemyContainerEntity.call(this, game, px, py, 128, 64, game.images.ufo_corvette, path);
	this.angle = 0;

	this.health = 500;
	this.fire_timer = 30 * 5;

	var cannon = new EnemyEntity(game, 0, -this.height / 3, 48, 48, game.images.ufo_corvette_cannon);
	cannon.collision_radius = 24;
	cannon.angle_granularity = 1;
	this.add_entity(cannon);
	var cannon = new EnemyEntity(game, 0, this.height / 3, 48, 48, game.images.ufo_corvette_cannon);
	cannon.collision_radius = 24;
	cannon.angle_granularity = 1;
	this.add_entity(cannon);

	var cannon = new EnemyEntity(game, this.width / 3, -this.height / 3, 48, 48, game.images.ufo_corvette_cannon);
	cannon.collision_radius = 24;
	cannon.angle_granularity = 1;
	this.add_entity(cannon);
	var cannon = new EnemyEntity(game, this.width / 3, this.height / 3, 48, 48, game.images.ufo_corvette_cannon);
	cannon.collision_radius = 24;
	cannon.angle_granularity = 1;
	this.add_entity(cannon);
}
UFOCorvetteEnemy.prototype = Object.create(EnemyContainerEntity.prototype);
UFOCorvetteEnemy.prototype.collision_radius = 32;
// UFOCorvetteEnemy.prototype.update = function(game) {
// 	EnemyContainerEntity.prototype.update.call(this, game);
// };
UFOCorvetteEnemy.prototype.fire = function(game, tx, ty) {
	for (var i = this.sub_entities.length - 1; i >= 0; i--) {
		var ent = this.sub_entities[i];
		var pos = this.get_global_position(ent);

		ent.angle = point_angle(pos.px, pos.py, tx, ty) - this.angle;
		this.spawn_bullets(game, pos, { px: tx, py: ty });
	}
};
UFOCorvetteEnemy.prototype.spawn_bullets = function(game, from, to) {
	var target_angle = point_angle(from.px, from.py, to.px, to.py);

	for (var k = -1; k <= 1; k++) {
		var angle_offset = k * 10;
		for (var i = 0; i < 4; i++) {
			game.add_entity(new EnemyBullet(game, from.px, from.py, [
				{ timeout: 240, angle: target_angle + angle_offset, speed: 1 + i * 0.5 },
			], game.images.bright_purple_square_bullet));
		}
	}
};


function PlayerShip(game, px, py) {
	PathEntity.call(this, game, px, py, 64, 64, game.images.fighter_transform_animation);
	this.max_frame = 8;
	// this.angle = 0;

	this.transformation_step = 0;

	this.tilt_angle = 0;
	this.fire_timer = 0;
	this.missile_fire_timer = 0;
	this.speed = 6;

	this.angle_granularity = 3;

	this.entity_tags.push(new CollisionEntityTag());
	var cross = new ScreenEntity(game, 0, 0, 64, 64, game.images.ui_position_cross);
	cross.rotation = 1;
	cross.angle_granularity = 1;
	this.ui_entities.push(cross);
	var cross = new ScreenEntity(game, 0, 0, 64, 64, game.images.ui_position_cross);
	cross.rotation = -1;
	cross.angle_granularity = 1;
	this.ui_entities.push(cross);
}
PlayerShip.prototype = Object.create(PathEntity.prototype);
PlayerShip.prototype.collision_radius = 8;
PlayerShip.prototype.collision_map = [
	{
		class: EnemyBullet,
		callback: 'hit_bullet',
	},
	{
		class: EnemyEntity,
		callback: 'hit_enemy',
	},
];
PlayerShip.prototype.update = function(game) {
	PathEntity.prototype.update.call(this, game);

	if (game.keystate.shift) {
		if (this.transformation_step < 14) {
			this.transformation_step++;
		}
	} else {
		if (this.transformation_step > 0) {
			this.transformation_step--;
		}
	}
	this.frame = Math.floor(this.transformation_step / 2);
	this.speed = 6 - this.transformation_step / 4;

	if (game.keystate.A) {
		this.px -= this.speed;
		if (this.px < 0) {
			this.px = 0;
		}

		if (this.transformation_step === 0) {
			if (this.tilt_angle > 0) {
				this.tilt_angle -= 9;
			} else if (this.tilt_angle > -30) {
				this.tilt_angle -= 3;
			}
			this.width = 64 - Math.abs(this.tilt_angle / 30 * 10);
		}
	} else if (game.keystate.D) {
		this.px += this.speed;
		if (this.px >= 640) {
			this.px = 640 - 1;
		}
		if (this.transformation_step === 0) {
			if (this.tilt_angle < 0) {
				this.tilt_angle += 9;
			} else if (this.tilt_angle < 30) {
				this.tilt_angle += 3;
			}
			this.width = 64 - Math.abs(this.tilt_angle / 30 * 10);
		}
	} else {
		if (this.transformation_step === 0) {
			if (this.tilt_angle < 0) {
				this.tilt_angle += 3;
			} else if (this.tilt_angle > 0) {
				this.tilt_angle -= 3;
			}
			this.width = 64 - Math.abs(this.tilt_angle / 30 * 10);
		}
	}
	this.angle = this.tilt_angle;

	if (game.keystate.W) {
		this.py -= this.speed;
		if (this.py < 0) {
			this.py = 0;
		}
	} else if (game.keystate.S) {
		this.py += this.speed;
		if (this.py >= 480) {
			this.py = 480 - 1;
		}
	}

	if (this.fire_timer) {
		this.fire_timer--;
	} else {
		if (game.keystate[' ']) {
			this.fire(game);
			this.fire_timer = 3;
		}
	}


	// this.fire_timer--;
	// if (this.fire_timer <= 0) {
	// 	this.fire(game);
	// 	this.fire_timer = 30 * 5;
	// }
};
PlayerShip.prototype.hit_bullet = function(game, bullet) {
	this.on_death(game);
	game.remove_entity(bullet);
	game.remove_entity(this);
};
PlayerShip.prototype.hit_enemy = function(game, bullet) {
	this.on_death(game);
	game.remove_entity(this);
};
PlayerShip.prototype.on_death = function(game) {

	var p = { px: this.px, py: this.py };
	// if (this.parent instanceof EnemyContainerEntity) {
	// 	p = this.parent.get_global_position(this);
	// }

	var count = 24 + Math.random() * 32;
	for (var i = 0; i < count; i++) {
		var offsetx = (Math.random() * this.width - (this.width / 2)) / 1.5;
		var offsety = (Math.random() * this.height - (this.height / 2)) / 1.5;
		game.particle_systems.explosion_particles.add_particle(p.px + offsetx, p.py + offsety, 2);
	}
	var count = Math.floor(2 + Math.random() * 2);
	for (var i = 0; i < count; i++) {
		game.particle_systems.ship_chunks.add_image_particle(this.image, this.width, this.height, p.px, p.py, 3);
	}

	for (var i = 0; i < this.sub_entities.length; i++) {
		if (this.sub_entities[i] instanceof EnemyEntity) {
			this.sub_entities[i].on_death(game);
		}
	}
};
PlayerShip.prototype.fire = function(game) {
	if (this.transformation_step >= 12) {
		var offset = d2_point_offset(this.tilt_angle, -this.width / 3, -this.height / 2);
		game.entities_to_add.push(new PlayerBullet(game, this.px + offset.px, this.py + offset.py, [
			{ timeout: 40, angle: this.tilt_angle - 90 - 15, speed: 16 },
		], game.images.red_streak_bullet));
		var offset = d2_point_offset(this.tilt_angle, this.width / 3, -this.height / 2);
		game.entities_to_add.push(new PlayerBullet(game, this.px + offset.px, this.py + offset.py, [
			{ timeout: 40, angle: this.tilt_angle - 90 + 15, speed: 16 },
		], game.images.red_streak_bullet));
	} else if (this.transformation_step === 0) {
		if (this.missile_fire_timer) {
			this.missile_fire_timer--;
		} else {
			this.missile_fire_timer = 5;

			var offset = point_offset(this.tilt_angle - 90 + 135, this.width / 2);
			game.add_entity(new PlayerMissile(game, this.px + offset.px, this.py + offset.py, [
				{ timeout: 60, angle: this.tilt_angle - 90 + 135, speed: 8 },
			]));
			var offset = point_offset(this.tilt_angle - 90 - 135, this.width / 2);
			game.add_entity(new PlayerMissile(game, this.px + offset.px, this.py + offset.py, [
				{ timeout: 360, angle: this.tilt_angle - 90 - 135, speed: 8 },
			]));
		}
	}
	var offset = d2_point_offset(this.tilt_angle, -this.width / 8, -this.height / 2);
	game.entities_to_add.push(new PlayerBullet(game, this.px + offset.px, this.py + offset.py, [
		{ timeout: 40, angle: this.tilt_angle - 90, speed: 16 },
	], game.images.red_streak_bullet));
	var offset = d2_point_offset(this.tilt_angle, this.width / 8, -this.height / 2);
	game.entities_to_add.push(new PlayerBullet(game, this.px + offset.px, this.py + offset.py, [
		{ timeout: 40, angle: this.tilt_angle - 90, speed: 16 },
	], game.images.red_streak_bullet));
};


function main () {
	var canvas = document.querySelector('#game_canvas');
	var ctx = canvas.getContext('2d');
	ctx.imageSmoothingEnabled = false;


	var assets = {
		images: {
			fighter: "fighter.png",
			fighter_missile: "fighter_missile.png",
			mini_fighter: "mini_fighter.png",
			fighter_attack_formation: "fighter_attack_formation.png",
			fighter_transform_animation: "fighter_transform_animation.png",
			ufo: "ufo.png",
			// ufo_small: "ufo_small.png",
			ufo_corsair: "ufo_corsair.png",
			ufo_corvette: "ufo_corvette.png",
			ufo_corvette_cannon: "ufo_corvette_cannon.png",

			red_streak_bullet: "red_streak_bullet.png",
			bright_purple_square_bullet: "bright_purple_square_bullet.png",
			purple_square_bullet: "purple_square_bullet.png",
			orange_round_bullet: "orange_round_bullet.png",
			// enemy_bullet_orange: "enemy_bullet_orange.png",
			// enemy_bullet_overlay_effect: "enemy_bullet_overlay_effect.png",
			purple_crystal: "purple_crystal.png",
			particle_effect_generic: "particle_effect_generic.png",
			particle_effect_explosion: "particle_effect_explosion.png",
			particle_star: "particle_star.png",

			asteroid_64: "asteroid_64.png",
			chop_piece: "chop_piece.png",
			pound_sign: "pound_sign.png",

			platform_core: "platform_core.png",
			platform_sections: "platform_sections.png",

			ufo_station_core: "ufo_station_core.png",
			ufo_station_pylon: "ufo_station_pylon.png",
			ufo_station_pylon2: "ufo_station_pylon2.png",

			ui_position_cross: "ui_position_cross.png",
		},
	};

	load_all_assets(assets, function (loaded_assets) {
		console.log("all assets loaded");

		var game = new GameSystem(canvas, loaded_assets);


		game.game_systems.collision_system = new CircularCollisionSystem(game);
		game.game_systems.input_manager = new InputManager(game);
		game.game_systems.input_manager.input_handlers.push({
			type: 'key_pressed',
			key: 'O',
			callback: function (game) {
				game.game_systems.debug_system.visible = !game.game_systems.debug_system.visible;
			},
		});

		game.game_systems.ui_container = new Entity(game);
		game.game_systems.ui_container.z_index = 100;
		var debug_button = new UIButton(game, 640 - 16, 480 - 16, 32, 32, game.images.pound_sign);
		debug_button.on_down = function (game) {
			this.angle = this.angle === 0 ? 90 : 0;
			// game.update_entities = !game.update_entities;
			game.game_systems.debug_system.visible = !game.game_systems.debug_system.visible;
		};
		// debug_button.on_up = function (game) {
		// 	this.angle = 0;
		// 	game.game_systems.debug_system.visible = false;
		// };
		game.game_systems.ui_container.add_entity(debug_button);

		game.game_systems.debug_system = new DebugSystem(game);
		game.game_systems.debug_system.visible = false;

		game.game_systems.debug_system.add_debug_text({
			update: function (game) {
				var player_bullets = game.query_entities(PlayerBullet);
				this.text = "# player bullets: " + player_bullets.length;
			},
		});

		game.game_systems.debug_system.add_debug_text({
			update: function (game) {
				this.text = "# stars: " + game.particle_systems.star_particles.particles.length;
			},
		});

		// game.game_systems.debug_system.add_debug_text({
		// 	update: function (game) {
		// 		var enemy_entities = game.query_entities(EnemyEntity);
		// 		this.text = "# enemy entities: " + enemy_entities.length;
		// 	},
		// });

		game.add_entity(new PlayerShip(game, 320, 240));

		// game.add_entity(new UFOStation(game, 320, 0, [
		// 	{ timeout: 120, sy: 0.1 },
		// 	{ timeout: 360, repeat: 4, sy: 0.1, call: [{ method: 'fire', args: [320, 240] }] },
		// ]));

		// game.add_entity(new UFOPlatform(game, 320, 0, [
		// 	{ timeout: 1000, sy: 0.5 },
		// 	{ timeout: 120, repeat: 4, call: [{ method: 'fire', args: [300, 300] }] },
		// 	{ timeout: 360, sy: 0.5, sx: 0.5 },
		// ]));

		game.add_entity(new UFOEnemy(game, 0,100, [
			{ timeout: 640, sx: 1 },
			{ timeout: 640, sx: -1 },
		]));

		game.add_entity(new UFOEnemy(game, 640,100, [
			{ timeout: 640, sx: -1 },
			{ timeout: 640, sx: 1 },
		]));

		for (var i = 0; i < 8; i++) {
			game.add_entity(new Asteroid(game, Math.random() * (640 + 200) - 100, -100 - Math.random() * 200, 1, [
				{ px: Math.random() * (640 + 200) - 100, py: 800, speed: 1.5 },
			]));
		}

		// game.add_entity(new UFOEnemy(game, 100,100, [
		// 	{ timeout: 120, sy: 1 },
		// 	{ timeout: 60, repeat: 5, sy: 1, call: [{ method: 'fire', args: [300, 300] }] },
		// ]));

		// game.add_entity(new UFOEnemy(game, 640 - 100, 100, [
		// 	{ timeout: 120, sy: 1 },
		// 	{ timeout: 60, repeat: 5, sy: 1, call: [{ method: 'fire', args: [300, 300] }] },
		// ]));

		game.add_entity(new UFOCorvetteEnemy(game, 320, -100, [
			{ timeout: 180, angle: 90, speed: 1 },
			{ timeout: 180, repeat: 2, angle: 90, speed: 0.1, call: [{ method: 'fire', args: [300, 300] }] },
			{ timeout: 180, repeat: 2, angle: 90, da: 90 / (180 * 2), speed: 0.25, call: [{ method: 'fire', args: [300, 300] }] },
			{ timeout: 360, angle: 180, speed: 0.75, call: [{ method: 'fire', args: [300, 300] }] },
		]));
		// game.add_entity(new UFOCorsairEnemy(game, 320, -100, [
		// 	{ timeout: 180, angle: 90, speed: 1 },
		// 	{ timeout: 180, repeat: 2, angle: 90, speed: 0.1, call: [{ method: 'fire' }] },
		// 	{ timeout: 180, repeat: 2, angle: 90, da: 90 / (180 * 2), speed: 0.25, call: [{ method: 'fire' }] },
		// 	{ timeout: 360, angle: 180, speed: 0.75, call: [{ method: 'fire' }] },
		// ]));

		// game.add_entity(new UFOPlatform(game, 500,-400, [
		// 	{ timeout: 1000, sy: 0.5 },
		// 	{ timeout: 120, repeat: 4, call: [{ method: 'fire', args: [300, 300] }] },
		// 	{ timeout: 360, sy: 0.5, sx: 0.5 },
		// ]));


		// game.add_entity(new EnemyBullet(game, 8,8, []));
		// game.add_entity(new UFOPlatform(game, 100,100));
		// game.add_entity(new UFOPlatform(game, 200,100));
		// game.add_entity(new UFOPlatform(game, 300,100));
		// game.add_entity(new UFOPlatform(game, 400,100));
		// game.add_entity(new UFOPlatform(game, 500,100));
		// game.add_entity(new UFOEnemy(game, 100,100));
		// game.add_entity(new UFOCorsairEnemy(game, 300,100));
		game.particle_systems.purple_particles = new ParticleEffectSystem(game, {
			fill_style: '#404',
			particle_deflate: 1.5,
		});
		game.particle_systems.red_particles = new ParticleEffectSystem(game, {
			fill_style: '#f88',
			particle_size: 12,
			particle_longevity: 0.3,
			particle_deflate: 1.5,
		});
		game.particle_systems.ship_chunks = new ParticleEffectSystem(game, {
			dynamic_images: true,
			particle_image: game.images.chop_piece,
			chopped_images: true,
			masked_images: true,
			max_frame: 1,
			particle_longevity: 0.003, 
		});
		game.particle_systems.explosion_particles = new ParticleEffectSystem(game, {
			particle_image: game.images.particle_effect_explosion,
			particle_size: 32,
			particle_longevity: 0.3,
			particle_respawn: 0.2,
		});
		game.particle_systems.star_particles = new ScrollingParticleBackground(game, {
			particle_image: game.images.particle_star,
			static_images: true,
			particle_size: 8,
			particle_longevity: -1,

			particle_spawn_count: 1,
			particle_min_speed: 0.1,
			particle_speed: 20,
		});
		game.particle_systems.star_particles.z_index = -10;

		setInterval(game.step_game_frame.bind(game, ctx), 1000 / 60);
	});
}


window.addEventListener('load', main);



