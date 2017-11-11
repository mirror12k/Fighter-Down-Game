

function load_image (url, callback) {
	var img = new Image();
	img.onload = callback.bind(undefined, img);
	img.src = url;
}

function load_all_images (images, callback) {
	var keys = Object.keys(images);
	var count_loaded = 0;
	for (var i = 0; i < keys.length; i++) {
		load_image(images[keys[i]], (function (key, img) {
			images[key] = img;

			count_loaded++;
			if (count_loaded === keys.length)
				callback();
		}).bind(undefined, keys[i]));
	}
}

function point_offset(angle, dist) {
	return { px: dist * Math.cos(Math.PI * angle / 180), py: dist * Math.sin(Math.PI * angle / 180), };
}

function point_angle(fromx, fromy, tox, toy) {
	var dx = tox - fromx;
	var dy = toy - fromy;
	var angle = Math.atan2(dy, dx);
	// console.log("angle: ", angle / Math.PI * 180);
	return angle / Math.PI * 180;
}

function GameSystem(images) {
	this.images = images;

	this.entities = [];
	this.entities_to_add = [];
	this.entities_to_remove = [];


	this.keystate = {
		W: false,
		A: false,
		S: false,
		D: false,
		' ': false,
	};
	document.addEventListener('keydown', (function (e) {
		e = e || window.event;
		var charcode = String.fromCharCode(e.keyCode);
		this.keystate[charcode] = true;
		// console.log('keydown: ', charcode);
	}).bind(this));

	document.addEventListener('keyup', (function (e) {
		e = e || window.event;
		var charcode = String.fromCharCode(e.keyCode);
		this.keystate[charcode] = false;
		// console.log('keyup: ', charcode);
	}).bind(this));
}
GameSystem.prototype.update = function () {
	for (var i = 0; i < this.entities.length; i++) {
		this.entities[i].update(this);
	}

	for (var i = 0; i < this.entities_to_remove.length; i++) {
		var index = this.entities.indexOf(this.entities_to_remove[i]);
		if (index >= 0)
			this.entities.splice(index, 1);
	}
	this.entities_to_remove = [];

	for (var i = 0; i < this.entities_to_add.length; i++)
		this.entities.push(this.entities_to_add[i]);
	this.entities_to_add = [];
};
GameSystem.prototype.draw = function (ctx) {
	ctx.clearRect(0, 0, 640, 480);

	ctx.fillStyle = 'rgb(0, 0, 0)';
	ctx.fillRect(0, 0, 640, 480);

	for (var i = 0; i < this.entities.length; i++) {
		this.entities[i].draw(ctx);
	}
};


function Entity(game) {}
Entity.prototype.update = function(entities) {};
Entity.prototype.draw = function(ctx) {};

function ScreenEntity(game, px, py, width, height, img) {
	this.px = px;
	this.py = py;
	this.angle = 0;
	this.frame = 0;
	this.max_frame = 1;
	this.width = width;
	this.height = height;
	this.img = img;

	this.angle_granularity = 15;
}
ScreenEntity.prototype = Object.create(Entity.prototype);
ScreenEntity.prototype.draw = function(ctx) {
	// ctx.drawImage(this.img, this.px - this.width / 2, this.py - this.height / 2, this.width, this.height);
	ctx.save();

	ctx.translate(this.px, this.py);
	ctx.rotate(Math.PI * (Math.floor(this.angle / this.angle_granularity) * this.angle_granularity) / 180);
	ctx.drawImage(this.img,
		this.frame * (this.img.width / this.max_frame), 0, this.img.width / this.max_frame, this.img.height,
		0 - this.width / 2, 0 - this.height / 2, this.width, this.height);

	ctx.restore();
};



function ParticleEffectSystem(game, fill_style) {
	this.fill_style = fill_style;
	this.particles = [];

	this.particle_image = game.images.particle_effect_generic;
	this.width = 32;
	this.height = 8;

	this.frame_width = 8;

	this.max_frame = this.width / this.frame_width;

	this.particle_width = 16;
	this.particle_height = 16;

	this.prepare_buffer();
}
ParticleEffectSystem.prototype = Object.create(ScreenEntity.prototype);
ParticleEffectSystem.prototype.prepare_buffer = function() {
	this.buffer_canvas = document.createElement('canvas');
	this.buffer_canvas.width = this.width;
	this.buffer_canvas.height = this.height;
	var buffer_context = this.buffer_canvas.getContext('2d');

	buffer_context.fillStyle = this.fill_style;
	buffer_context.fillRect(0,0, this.buffer_canvas.width, this.buffer_canvas.height);

	buffer_context.globalCompositeOperation = "destination-atop";
	buffer_context.drawImage(this.particle_image, 0,0);
};
ParticleEffectSystem.prototype.add_particle = function(px, py, speed) {
	var sx = ((Math.random() - 0.5) * speed) ** 2 - ((Math.random() - 0.5) * speed) ** 2;
	var sy = ((Math.random() - 0.5) * speed) ** 2 - ((Math.random() - 0.5) * speed) ** 2;

	this.particles.push({
		px: px,
		py: py,
		sx: sx,
		sy: sy,
		sr: Math.random() - 0.5,
		angle: Math.random() * 360,
		frame: 0,
	});
};
ParticleEffectSystem.prototype.update = function(game) {
	for (var i = this.particles.length - 1; i >= 0; i--) {
		this.particles[i].px += this.particles[i].sx;
		this.particles[i].py += this.particles[i].sy;
		this.particles[i].angle += this.particles[i].sr;

		if (Math.random() > 0.95) {
			this.particles[i].frame++;
			if (this.particles[i].frame >= this.max_frame) {
				this.particles.splice(i, 1);
			}
		}
	}
};
ParticleEffectSystem.prototype.draw = function(ctx) {

	// console.log("drawing ", this.particles.length, "particles");
	for (var i = 0; i < this.particles.length; i++) {
		var p = this.particles[i];
		ctx.save();

		ctx.translate(p.px, p.py);
		ctx.rotate(Math.PI * (Math.floor(p.angle / 15) * 15) / 180);
		// var width = this.particle_width;
		// var height = this.particle_height;
		var width = this.particle_width * ((6 - p.frame) / 4);
		var height = this.particle_height * ((6 - p.frame) / 4);
		ctx.drawImage(this.buffer_canvas, 
			this.frame_width * p.frame, 0, this.frame_width, this.height,
			0 - width / 2, 0 - height / 2, width, height);

		ctx.restore();
	}
};








function PathEntity(game, px, py, width, height, img, path) {
	ScreenEntity.call(this, game, px, py, width, height, img);

	// console.log('debug path: ', path);
	this.path = path;
	this.path_index = 0;
	this.current_action = undefined;
}
PathEntity.prototype = Object.create(ScreenEntity.prototype);
PathEntity.prototype.trigger_path_action = function(game) {
	if (this.current_action.delete !== undefined) {
		game.entities_to_remove.push(this);
	}

	if (this.current_action.px !== undefined) {
		this.current_action.sx = (this.current_action.px - this.px) / this.current_action.timeout;
		this.current_action.sy = (this.current_action.py - this.py) / this.current_action.timeout;
	}

	if (this.current_action.sx == undefined)
		this.current_action.sx = 0;
	if (this.current_action.sy == undefined)
		this.current_action.sy = 0;

	if (this.current_action.angle !== undefined) {
		this.current_action.sx = Math.cos(this.current_action.angle / 180 * Math.PI) * this.current_action.speed;
		this.current_action.sy = Math.sin(this.current_action.angle / 180 * Math.PI) * this.current_action.speed;
		this.angle = this.current_action.angle;
	}

	if (this.current_action.timeout) {
		this.timer = this.current_action.timeout;
	}

	if (this.current_action.spawn) {
		for (var i = 0; i < this.current_action.spawn.length; i++) {
			// console.log("debug path: ", this.current_action.spawn[i].path);
			var bullet = new EnemyBullet(game, this.px, this.py, this.current_action.spawn[i].path, this.current_action.spawn[i].img);
			bullet.angle = this.angle;
			game.entities_to_add.push(bullet);
		}
	}

	if (this.current_action.call) {
		for (var i = 0; i < this.current_action.call.length; i++) {
			var args = this.current_action.call[i].args || [];
			args = args.slice(0);
			args.unshift(game);
			this[this.current_action.call[i].method].apply(this, args);
		}
	}
};
PathEntity.prototype.update = function(game) {
	if (this.current_action === undefined) {
		if (this.path.length > this.path_index) {
			this.current_action = this.path[this.path_index];
			this.path_index++;
			this.trigger_path_action(game);
		} else {
			game.entities_to_remove.push(this);
		}
	} else {
		if (this.current_action.fda !== undefined) {
			this.current_action.da *= this.current_action.fda;
		}
		if (this.current_action.da !== undefined) {
			this.current_action.angle += this.current_action.da;
			this.angle = this.current_action.angle;
			this.current_action.sx = Math.cos(this.current_action.angle / 180 * Math.PI) * this.current_action.speed;
			this.current_action.sy = Math.sin(this.current_action.angle / 180 * Math.PI) * this.current_action.speed;
		}

		if (this.current_action.trail) {
			if (Math.random() < this.current_action.trail.thickness) {
				game.particle_system.add_particle(this.px, this.py, 2);
			}
		}

		this.px += this.current_action.sx;
		this.py += this.current_action.sy;

		if (this.current_action.timeout !== undefined) {
			this.timer--;
			if (this.timer <= 0) {
				if (this.current_action.repeat !== undefined && this.current_action.repeat > 1) {
					this.current_action.repeat--;
					this.timer = this.current_action.timeout;
					this.trigger_path_action(game);
				} else {
					this.current_action = undefined;
				}
			}
		}
	}
};

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
	// 	game.particle_system.add_particle(this.px + offset.px, this.py + offset.py, 2)
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

	this.fire_timer = 0;
	this.speed = 4;
}
PlayerShip.prototype = Object.create(ScreenEntity.prototype);
PlayerShip.prototype.update = function(game) {
	ScreenEntity.prototype.update.call(this, game);

	if (game.keystate.A) {
		this.px -= this.speed;
	} else if (game.keystate.D) {
		this.px += this.speed;
	}

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

	// this.fire_timer--;
	// if (this.fire_timer <= 0) {
	// 	this.fire(game);
	// 	this.fire_timer = 30 * 5;
	// }

	// if (Math.random() > 0.8) {
	// 	var offset = point_offset(this.angle, 32);
	// 	game.particle_system.add_particle(this.px + offset.px, this.py + offset.py, 2)
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
	game.entities_to_add.push(new PlayerBullet(game, this.px - this.width / 8, this.py - this.height / 2, [
		{ timeout: 40, repeat: 8, sy: -16 },
	], game.images.red_streak_bullet));
	game.entities_to_add.push(new PlayerBullet(game, this.px + this.width / 8, this.py - this.height / 2, [
		{ timeout: 40, repeat: 8, sy: -16 },
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
		game.particle_system = new ParticleEffectSystem(game, '#404');
		game.entities.push(game.particle_system);

		setInterval(step_game_frame.bind(undefined, ctx, game), 1000 / 60);
	});
}

function step_game_frame(ctx, game)
{
	// console.log('step');
	game.update();
	game.draw(ctx);
}


window.addEventListener('load', main);



