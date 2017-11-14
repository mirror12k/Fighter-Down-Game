


function EnemyBullet(game, px, py, path, img) {
	img = img || game.images.orange_round_bullet;
	PathEntity.call(this, game, px, py, 16, 16, img, path);

	this.angle_granularity = 5;
}
EnemyBullet.prototype = Object.create(PathEntity.prototype);

function PlayerBullet(game, px, py, path, img) {
	img = img || game.images.orange_round_bullet;
	PathEntity.call(this, game, px, py, 32, 32, img, path);

	this.angle_granularity = 5;
}
PlayerBullet.prototype = Object.create(PathEntity.prototype);



function UFOEnemy(game, px, py, path) {
	PathEntity.call(this, game, px, py, 64, 64, game.images.ufo, path);
	this.health = 250;
}
UFOEnemy.prototype = Object.create(PathEntity.prototype);
// UFOEnemy.prototype.draw = function(ctx) {
// 	ctx.save();

// 	ctx.translate(this.px, this.py);
// 	ctx.rotate(Math.PI * (Math.floor(this.angle / 15) * 15) / 180);
// 	ctx.drawImage(this.img, 0 - this.width / 2, 0 - this.height / 2, this.width, this.height);

// 	ctx.restore();
// };
UFOEnemy.prototype.update = function(game) {
	PathEntity.prototype.update.call(this, game);
	this.angle += 1;
	this.angle %= 360;

	var colliding_bullets = game.find_colliding(this, PlayerBullet, 48);
	for (var i = 0; i < colliding_bullets.length; i++) {
		this.take_damage(game, 5);
		game.entities_to_remove.push(colliding_bullets[i]);
		// if (Math.random() < 0.3)
			game.particle_systems.red_particles.add_particle(colliding_bullets[i].px, colliding_bullets[i].py, 3);
	}
};

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

UFOEnemy.prototype.take_damage = function(game, damage) {
	this.health -= damage;
	if (this.health <= 0) {
		game.entities_to_remove.push(this);

		var count = 24 + Math.random() * 32;
		for (var i = 0; i < count; i++) {
			var offsetx = (Math.random() * this.width - (this.width / 2)) / 1.5;
			var offsety = (Math.random() * this.height - (this.height / 2)) / 1.5;
			game.particle_systems.explosion_particles.add_particle(this.px + offsetx, this.py + offsety, 2);
		}
		var count = Math.floor(1 + Math.random() * 2);
		for (var i = 0; i < count; i++) {
			game.particle_systems.ship_chunks.add_image_particle(this.img, this.width, this.height, this.px, this.py, 3);
		}
	}
};





function UFOPlatformSection(game, px, py) {
	ScreenEntity.call(this, game, px, py, 64, 64, game.images.platform_sections);
	this.frame = Math.floor(Math.random() * 4);
	this.max_frame = 4;
	this.angle = 90 * Math.floor(Math.random() * 4);
	// this.angle = Math.random() * 360;
}
UFOPlatformSection.prototype = Object.create(ScreenEntity.prototype);

function UFOPlatform(game, px, py, path) {
	PathEntity.call(this, game, px, py, 64, 64, game.images.platform_core, path);

	this.sections = [];

	var section_count = Math.floor(Math.random() * 3) + 3;

	for (var i = 0; i < section_count; i++) {
		var offset = point_offset(i * (360 / section_count) + Math.random() * (360 / section_count), 48);
		this.sections.push(new UFOPlatformSection(game, offset.px, offset.py));
	}

	this.rotation = 0.25 * (Math.floor(Math.random() * 5) - 2);
	this.angle = Math.random() * 360;
}
UFOPlatform.prototype = Object.create(PathEntity.prototype);
UFOPlatform.prototype.update = function(game) {
	PathEntity.prototype.update.call(this, game);
	this.angle += this.rotation;
	this.angle %= 360;

	if (this.firing > 0)
		this.spawn_bullets(game);
};
UFOPlatform.prototype.draw = function(ctx) {
	ctx.save();

	ctx.translate(this.px, this.py);
	ctx.rotate(Math.PI * (Math.floor(this.angle / 15) * 15) / 180);

	for (var i = 0; i < this.sections.length; i++) {
		this.sections[i].draw(ctx);
	}
	ctx.drawImage(this.img,
		this.frame * this.width, 0, this.img.width, this.img.height,
		0 - this.width / 2, 0 - this.height / 2, this.width, this.height);

	ctx.restore();
};

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
		spawn_burst.push({ img: game.images.bright_purple_square_bullet, path: [{ timeout: 120, angle: target_angle + i * 45, speed: 1 }] });
	}

	// spawn flak bullet
	if (Math.random() < 0.1) {
		game.entities_to_add.push(new EnemyBullet(game, this.px, this.py, [
			{ trail: { thickness: 0.01 }, timeout: 120, angle: target_angle, speed: 1.5 + Math.random() * 2 },
			{ spawn: spawn_burst, delete: true },
		], game.images.purple_square_bullet));
	}
};
UFOPlatform.prototype.fire = function(game, tx, ty) {
	this.firing = 40;
	this.fire_target = { px: tx, py: ty };

	this.spawn_bullets(game);
};




function UFOStationPylon(game, px, py) {
	ScreenEntity.call(this, game, px, py, 64, 64, game.images.ufo_station_pylon2);
}
UFOStationPylon.prototype = Object.create(ScreenEntity.prototype);

function UFOStation(game, px, py, path) {
	PathEntity.call(this, game, px, py, 64, 64, game.images.ufo_station_core, path);

	this.inner_ring = [];
	this.outer_ring = [];

	var section_count = 6;
	for (var i = 0; i < section_count; i++) {
		var offset = point_offset(i * (360 / section_count), 24);
		var pylon = new UFOStationPylon(game, offset.px, offset.py);
		pylon.angle = i * (360 / section_count);
		this.inner_ring.push(pylon);
	}

	for (var i = 0; i < section_count; i++) {
		var offset = point_offset((i + 0.5) * (360 / section_count), 32);
		var pylon = new UFOStationPylon(game, offset.px, offset.py);
		pylon.angle = (i + 0.5) * (360 / section_count);
		this.outer_ring.push(pylon);
	}

	this.ring_angle = 0;
	this.rotation = 0.25;
}
UFOStation.prototype = Object.create(PathEntity.prototype);
UFOStation.prototype.update = function(game) {
	PathEntity.prototype.update.call(this, game);
	this.ring_angle += this.rotation;
	this.ring_angle %= 360;

	if (this.firing > 0)
		this.spawn_bullets(game);
};
UFOStation.prototype.draw = function(ctx) {
	ctx.save();

	ctx.translate(this.px, this.py);
	ctx.rotate(Math.PI * (Math.floor(this.angle / 15) * 15) / 180);

	ctx.save();
	ctx.rotate(Math.PI * (Math.floor(this.ring_angle / 5) * 5) / 180);
	for (var i = 0; i < this.outer_ring.length; i++) {
		this.outer_ring[i].draw(ctx);
	}
	ctx.restore();

	ctx.save();
	ctx.rotate(Math.PI * (Math.floor(-this.ring_angle / 5) * 5) / 180);
	for (var i = 0; i < this.inner_ring.length; i++) {
		this.inner_ring[i].draw(ctx);
	}
	ctx.restore();

	ctx.drawImage(this.img,
		this.frame * this.width, 0, this.img.width, this.img.height,
		0 - this.width / 2, 0 - this.height / 2, this.width, this.height);

	ctx.restore();
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






function RotatingCrystalEntity(game, px, py) {
	ScreenEntity.call(this, game, px, py, 16, 16, game.images.purple_crystal);
	this.angle = 0;
}
RotatingCrystalEntity.prototype = Object.create(ScreenEntity.prototype);
RotatingCrystalEntity.prototype.update = function(game) {
	this.angle += 1;
	this.angle %= 360;
};
// RotatingCrystalEntity.prototype.draw = function(ctx) {
// 	ctx.save();

// 	ctx.translate(this.px, this.py);
// 	ctx.rotate(Math.PI * (Math.floor(this.angle / 15) * 15) / 180);
// 	ctx.drawImage(this.img, 0 - this.width / 2, 0 - this.height / 2, this.width, this.height);

// 	ctx.restore();
// };

function UFOCorsairEnemy(game, px, py, path) {
	PathEntity.call(this, game, px, py, 128, 64, game.images.ufo_corsair, path);
	this.crystal_ent = new RotatingCrystalEntity(game, this.width / 4, 0);
	this.angle = 0;

	this.fire_timer = 30 * 5;
}
UFOCorsairEnemy.prototype = Object.create(PathEntity.prototype);
UFOCorsairEnemy.prototype.update = function(game) {
	PathEntity.prototype.update.call(this, game);
	this.crystal_ent.update(game);

	// this.fire_timer--;
	// if (this.fire_timer <= 0) {
	// 	this.fire(game);
	// 	this.fire_timer = 30 * 5;
	// }

	// if (Math.random() > 0.8) {
	// 	var offset = point_offset(this.angle, 32);
	// 	game.particle_systems.purple_particles.add_particle(this.px + offset.px, this.py + offset.py, 2)
	// }
};
UFOCorsairEnemy.prototype.draw = function(ctx) {
	ctx.save();

	ctx.translate(this.px, this.py);
	ctx.rotate(Math.PI * (Math.floor(this.angle / 15) * 15) / 180);
	ctx.drawImage(this.img, 0 - this.width / 2, 0 - this.height / 2, this.width, this.height);

	this.crystal_ent.draw(ctx);

	ctx.restore();
};
UFOCorsairEnemy.prototype.fire = function(game) {
	var offset = point_offset(this.angle, this.width / 4);

	for (var da = 0.25; da < 2; da += 0.5) {
		game.entities_to_add.push(new EnemyBullet(game, this.px + offset.px, this.py + offset.py, [
			{
				timeout: 20, repeat: 8,
				spawn: [{ img: game.images.bright_purple_square_bullet, path: [{timeout: 90, trail: { thickness: 0.01 }, }, {delete: true}] }],
				trail: { thickness: 0.03 }, angle: this.angle, speed: 3, da: da
			},
			{ delete: true },
		], game.images.purple_square_bullet));
		game.entities_to_add.push(new EnemyBullet(game, this.px + offset.px, this.py + offset.py, [
			{
				timeout: 20, repeat: 8,
				spawn: [{ img: game.images.bright_purple_square_bullet, path: [{timeout: 90, trail: { thickness: 0.01 }, }, {delete: true}] }],
				trail: { thickness: 0.03 }, angle: this.angle, speed: 3, da: -da
			},
			{ delete: true },
		], game.images.purple_square_bullet));
		
	}
};


function PlayerShip(game, px, py) {
	PathEntity.call(this, game, px, py, 64, 64, game.images.fighter);
	// this.angle = 0;

	this.tilt_angle = 0;
	this.fire_timer = 0;
	this.speed = 6;

	this.angle_granularity = 3;
}
PlayerShip.prototype = Object.create(ScreenEntity.prototype);
PlayerShip.prototype.update = function(game) {
	ScreenEntity.prototype.update.call(this, game);

	if (game.keystate.A) {
		this.px -= this.speed;
		if (this.tilt_angle > 0) {
			this.tilt_angle -= 9;
		} else if (this.tilt_angle > -30) {
			this.tilt_angle -= 3;
		}
		this.width = 64 - Math.abs(this.tilt_angle / 30 * 10);
	} else if (game.keystate.D) {
		this.px += this.speed;
		if (this.tilt_angle < 0) {
			this.tilt_angle += 9;
		} else if (this.tilt_angle < 30) {
			this.tilt_angle += 3;
		}
		this.width = 64 - Math.abs(this.tilt_angle / 30 * 10);
	} else {
		if (this.tilt_angle < 0) {
			this.tilt_angle += 3;
		} else if (this.tilt_angle > 0) {
			this.tilt_angle -= 3;
		}
		this.width = 64 - Math.abs(this.tilt_angle / 30 * 10);
	}
	this.angle = this.tilt_angle;

	if (game.keystate.W) {
		this.py -= this.speed;
	} else if (game.keystate.S) {
		this.py += this.speed;
	}

	if (this.fire_timer) {
		this.fire_timer--;
	} else {
		if (game.keystate[' ']) {
			this.fire(game);
			this.fire_timer = 3;
		}
	}

	var colliding_bullets = game.find_colliding(this, EnemyBullet, 24);
	if (colliding_bullets.length > 0) {
		for (var i = 0; i < colliding_bullets.length; i++) {
			game.entities_to_remove.push(colliding_bullets[i]);
		}
	}


	// this.fire_timer--;
	// if (this.fire_timer <= 0) {
	// 	this.fire(game);
	// 	this.fire_timer = 30 * 5;
	// }

	// if (Math.random() > 0.8) {
	// 	var offset = point_offset(this.angle, 32);
	// 	game.particle_systems.purple_particles.add_particle(this.px + offset.px, this.py + offset.py, 2)
	// }
};
// PlayerShip.prototype.draw = function(ctx) {
// 	ctx.save();

// 	ctx.translate(this.px, this.py);
// 	ctx.rotate(Math.PI * (Math.floor(this.angle / 15) * 15) / 180);
// 	ctx.drawImage(this.img, 0 - this.width / 2, 0 - this.height / 2, this.width, this.height);

// 	this.crystal_ent.draw(ctx);

// 	ctx.restore();
// };
PlayerShip.prototype.fire = function(game) {
	var offset = d2_point_offset(this.tilt_angle, -this.width / 8, -this.height / 2);
	game.entities_to_add.push(new PlayerBullet(game, this.px + offset.px, this.py + offset.py, [
		{ timeout: 40, angle: this.tilt_angle - 90, speed: 16 },
	], game.images.red_streak_bullet));
	offset = d2_point_offset(this.tilt_angle, this.width / 8, -this.height / 2);
	game.entities_to_add.push(new PlayerBullet(game, this.px + offset.px, this.py + offset.py, [
		{ timeout: 40, angle: this.tilt_angle - 90, speed: 16 },
	], game.images.red_streak_bullet));
};


function main () {
	var canvas = document.querySelector('#game_canvas');
	var ctx = canvas.getContext('2d');
	ctx.imageSmoothingEnabled = false;



	var images = {
		fighter: "fighter.png",
		mini_fighter: "mini_fighter.png",
		fighter_attack_formation: "fighter_attack_formation.png",
		fighter_transform_animation: "fighter_transform_animation.png",
		ufo: "ufo.png",
		ufo_small: "ufo_small.png",
		ufo_corsair: "ufo_corsair.png",

		red_streak_bullet: "red_streak_bullet.png",
		bright_purple_square_bullet: "bright_purple_square_bullet.png",
		purple_square_bullet: "purple_square_bullet.png",
		orange_round_bullet: "orange_round_bullet.png",
		// enemy_bullet_orange: "enemy_bullet_orange.png",
		// enemy_bullet_overlay_effect: "enemy_bullet_overlay_effect.png",
		purple_crystal: "purple_crystal.png",
		particle_effect_generic: "particle_effect_generic.png",
		particle_effect_explosion: "particle_effect_explosion.png",

		platform_core: "platform_core.png",
		platform_sections: "platform_sections.png",

		ufo_station_core: "ufo_station_core.png",
		ufo_station_pylon: "ufo_station_pylon.png",
		ufo_station_pylon2: "ufo_station_pylon2.png",
	};

	load_all_images(images, function () {
		console.log("all images loaded");

		var game = new GameSystem(images);

		game.entities.push(new PlayerShip(game, 320, 240));

		game.entities.push(new UFOStation(game, 320, 0, [
			{ timeout: 120, sy: 0.1 },
			{ timeout: 360, repeat: 4, sy: 0.1, call: [{ method: 'fire', args: [320, 240] }] },
		]));

		game.entities.push(new UFOEnemy(game, 0,100, [
			{ timeout: 640, sx: 1 },
			{ timeout: 640, sx: -1 },
		]));

		game.entities.push(new UFOEnemy(game, 640,100, [
			{ timeout: 640, sx: -1 },
			{ timeout: 640, sx: 1 },
		]));

		// game.entities.push(new UFOEnemy(game, 100,100, [
		// 	{ timeout: 120, sy: 1 },
		// 	{ timeout: 60, repeat: 5, sy: 1, call: [{ method: 'fire', args: [300, 300] }] },
		// ]));

		// game.entities.push(new UFOEnemy(game, 640 - 100, 100, [
		// 	{ timeout: 120, sy: 1 },
		// 	{ timeout: 60, repeat: 5, sy: 1, call: [{ method: 'fire', args: [300, 300] }] },
		// ]));

		// game.entities.push(new UFOCorsairEnemy(game, 320, -100, [
		// 	{ timeout: 360, angle: 90, speed: 0.5 },
		// 	{ timeout: 180, repeat: 2, angle: 90, speed: 0.1, call: [{ method: 'fire' }] },
		// 	{ timeout: 180, repeat: 2, angle: 90, da: 90 / (180 * 2), speed: 0.25, call: [{ method: 'fire' }] },
		// 	{ timeout: 360, angle: 180, speed: 0.75, call: [{ method: 'fire' }] },
		// ]));

		// game.entities.push(new UFOPlatform(game, 500,-400, [
		// 	{ timeout: 1000, sy: 0.5 },
		// 	{ timeout: 120, repeat: 4, call: [{ method: 'fire', args: [300, 300] }] },
		// 	{ timeout: 360, sy: 0.5, sx: 0.5 },
		// ]));


		// game.entities.push(new EnemyBullet(game, 8,8, []));
		// game.entities.push(new UFOPlatform(game, 100,100));
		// game.entities.push(new UFOPlatform(game, 200,100));
		// game.entities.push(new UFOPlatform(game, 300,100));
		// game.entities.push(new UFOPlatform(game, 400,100));
		// game.entities.push(new UFOPlatform(game, 500,100));
		// game.entities.push(new UFOEnemy(game, 100,100));
		// game.entities.push(new UFOCorsairEnemy(game, 300,100));
		game.particle_systems.purple_particles = new ParticleEffectSystem(game, { fill_style: '#404', });
		game.particle_systems.red_particles = new ParticleEffectSystem(game, { fill_style: '#f88', particle_size: 12, particle_longevity: 0.3, });
		game.particle_systems.ship_chunks = new ParticleEffectSystem(game, {
					dynamic_images: true,
					max_frame: 1,
					particle_longevity: 0.01, 
				});
		game.particle_systems.explosion_particles = new ParticleEffectSystem(game,
				{ particle_size: 32, image: game.images.particle_effect_explosion, particle_longevity: 0.3, particle_respawn: 0.2 });

		setInterval(game.step_game_frame.bind(game, ctx), 1000 / 60);
	});
}


window.addEventListener('load', main);



