

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

function GameSystem(images) {
	this.images = images;

	this.entities = [];
	this.entities_to_add = [];
	this.entities_to_remove = [];
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

	// ctx.fillStyle = 'rgba(0, 0, 200, 0.5)';
	// ctx.fillRect(30, 30, 50, 50);

	// ctx.drawImage(this.images.fighter, 0, 0, 64, 64);
	// // ctx.drawImage(this.images.mini_fighter, 20, 20, 256, 256);
	// ctx.drawImage(this.images.fighter_transform_animation, 0 + 64 * 0, 0, 64, 64, 20 + 64 * 0, 20, 64, 64);
	// ctx.drawImage(this.images.fighter_transform_animation, 0 + 64 * 1, 0, 64, 64, 20 + 64 * 1, 20, 64, 64);
	// ctx.drawImage(this.images.fighter_transform_animation, 0 + 64 * 2, 0, 64, 64, 20 + 64 * 2, 20, 64, 64);
	// ctx.drawImage(this.images.fighter_transform_animation, 0 + 64 * 3, 0, 64, 64, 20 + 64 * 3, 20, 64, 64);
	// ctx.drawImage(this.images.fighter_transform_animation, 0 + 64 * 4, 0, 64, 64, 20 + 64 * 4, 20, 64, 64);
	// ctx.drawImage(this.images.fighter_transform_animation, 0 + 64 * 5, 0, 64, 64, 20 + 64 * 5, 20, 64, 64);
	// ctx.drawImage(this.images.fighter_transform_animation, 0 + 64 * 6, 0, 64, 64, 20 + 64 * 6, 20, 64, 64);
	// ctx.drawImage(this.images.fighter_transform_animation, 0 + 64 * 7, 0, 64, 64, 20 + 64 * 7, 20, 64, 64);

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
	this.width = width;
	this.height = height;
	this.img = img;

}
ScreenEntity.prototype = Object.create(Entity.prototype);
ScreenEntity.prototype.draw = function(ctx) {
	// ctx.drawImage(this.img, this.px - this.width / 2, this.py - this.height / 2, this.width, this.height);
	ctx.save();

	ctx.translate(this.px, this.py);
	ctx.rotate(Math.PI * (Math.floor(this.angle / 15) * 15) / 180);
	ctx.drawImage(this.img, 0 - this.width / 2, 0 - this.height / 2, this.width, this.height);

	ctx.restore();
};

function UFOEnemy(game, px, py) {
	ScreenEntity.call(this, game, px, py, 64, 64, game.images.ufo);
	this.angle = 0;
}
UFOEnemy.prototype = Object.create(ScreenEntity.prototype);
// UFOEnemy.prototype.draw = function(ctx) {
// 	ctx.save();

// 	ctx.translate(this.px, this.py);
// 	ctx.rotate(Math.PI * (Math.floor(this.angle / 15) * 15) / 180);
// 	ctx.drawImage(this.img, 0 - this.width / 2, 0 - this.height / 2, this.width, this.height);

// 	ctx.restore();
// };
UFOEnemy.prototype.update = function(game) {
	this.angle += 1;
	this.angle %= 360;
	if (this.angle % 180 == 0) {
		this.fire(game, 200, 100);
	}
};

UFOEnemy.prototype.fire = function(game, tx, ty) {
	var dx = tx - this.px;
	var dy = ty - this.py;
	var angle = Math.atan2(dy, dx);
	console.log("angle: ", angle / Math.PI * 180);

	var sx = Math.cos(angle) * 2;
	var sy = Math.sin(angle) * 2;

	for (var a = 0; a < 360; a += 30) {
		var bx = Math.cos(a / 180 * Math.PI) * 40;
		var by = Math.sin(a / 180 * Math.PI) * 40;

		var path = [
			{ timeout: 30, px: this.px + bx, py: this.py + by, },
			{ timeout: 30, },
			{ timeout: 180, da: 1, fda: 0.99, angle: angle / Math.PI * 180, speed: 2 },
			// { sx: sx, sy: sy, },
			{ timeout: 60, },
			{ delete: true, },
		];
		game.entities_to_add.push(new EnemyBullet(game, this.px, this.py, path));
	}
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

function UFOCorsairEnemy(game, px, py) {
	ScreenEntity.call(this, game, px, py, 128, 64, game.images.ufo_corsair);
	this.crystal_ent = new RotatingCrystalEntity(game, 32, 0);
	this.angle = 0;

	this.fire_timer = 30 * 5;
}
UFOCorsairEnemy.prototype = Object.create(ScreenEntity.prototype);
UFOCorsairEnemy.prototype.update = function(game) {
	this.crystal_ent.update(game);
	this.angle += 0.2;

	this.fire_timer--;
	if (this.fire_timer <= 0) {
		this.fire(game);
		this.fire_timer = 30 * 5;
	}

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
	var offset = point_offset(this.angle, 32);

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

function EnemyBullet(game, px, py, path, img) {
	img = img || game.images.enemy_bullet_orange;
	// console.log('debug path: ', path);
	ScreenEntity.call(this, game, px, py, 16, 16, img);

	this.path = path;
	this.path_index = 0;
	this.current_action = undefined;
}
EnemyBullet.prototype = Object.create(ScreenEntity.prototype);
EnemyBullet.prototype.trigger_path_action = function(game) {
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
};
EnemyBullet.prototype.update = function(game) {
	if (this.current_action === undefined) {
		if (this.path.length > this.path_index) {
			this.current_action = this.path[this.path_index];
			this.path_index++;
			this.trigger_path_action(game);
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
				if (this.current_action.repeat !== undefined && this.current_action.repeat > 0) {
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

		bright_purple_square_bullet: "bright_purple_square_bullet.png",
		purple_square_bullet: "purple_square_bullet.png",
		enemy_bullet_orange: "enemy_bullet_orange.png",
		enemy_bullet_overlay_effect: "enemy_bullet_overlay_effect.png",
		purple_crystal: "purple_crystal.png",
		particle_effect_generic: "particle_effect_generic.png",
	};

	load_all_images(images, function () {
		console.log("all images loaded");

		var game = new GameSystem(images);

		game.entities.push(new EnemyBullet(game, 8,8, []));
		// game.entities.push(new UFOEnemy(game, 100,100));
		game.entities.push(new UFOCorsairEnemy(game, 300,100));
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



