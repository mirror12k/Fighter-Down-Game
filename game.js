

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

	ctx.fillStyle = 'rgb(200, 0, 0)';
	ctx.fillRect(10, 10, 50, 50);

	ctx.fillStyle = 'rgba(0, 0, 200, 0.5)';
	ctx.fillRect(30, 30, 50, 50);

	ctx.drawImage(this.images.fighter, 0, 0, 64, 64);
	// ctx.drawImage(this.images.mini_fighter, 20, 20, 256, 256);
	ctx.drawImage(this.images.fighter_transform_animation, 0 + 64 * 0, 0, 64, 64, 20 + 64 * 0, 20, 64, 64);
	ctx.drawImage(this.images.fighter_transform_animation, 0 + 64 * 1, 0, 64, 64, 20 + 64 * 1, 20, 64, 64);
	ctx.drawImage(this.images.fighter_transform_animation, 0 + 64 * 2, 0, 64, 64, 20 + 64 * 2, 20, 64, 64);
	ctx.drawImage(this.images.fighter_transform_animation, 0 + 64 * 3, 0, 64, 64, 20 + 64 * 3, 20, 64, 64);
	ctx.drawImage(this.images.fighter_transform_animation, 0 + 64 * 4, 0, 64, 64, 20 + 64 * 4, 20, 64, 64);
	ctx.drawImage(this.images.fighter_transform_animation, 0 + 64 * 5, 0, 64, 64, 20 + 64 * 5, 20, 64, 64);
	ctx.drawImage(this.images.fighter_transform_animation, 0 + 64 * 6, 0, 64, 64, 20 + 64 * 6, 20, 64, 64);
	ctx.drawImage(this.images.fighter_transform_animation, 0 + 64 * 7, 0, 64, 64, 20 + 64 * 7, 20, 64, 64);

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
	this.width = width;
	this.height = height;
	this.img = img;
}
ScreenEntity.prototype = Object.create(Entity.prototype);
ScreenEntity.prototype.draw = function(ctx) {
	ctx.drawImage(this.img, this.px - this.width / 2, this.py - this.height / 2, this.width, this.height);
};

function UFOEnemy(game, px, py) {
	ScreenEntity.call(this, game, px, py, 64, 64, game.images.ufo);
	this.angle = 0;
}
UFOEnemy.prototype = Object.create(ScreenEntity.prototype);
UFOEnemy.prototype.draw = function(ctx) {
	ctx.save();

	ctx.translate(this.px, this.py);
	ctx.rotate(Math.PI * (Math.floor(this.angle / 15) * 15) / 180);
	ctx.drawImage(this.img, 0 - this.width / 2, 0 - this.height / 2, this.width, this.height);

	ctx.restore();
};
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
			{ timer: 30, px: this.px + bx, py: this.py + by, },
			{ timer: 30, },
			{ timer: 180, da: 1, fda: 0.99, angle: angle / Math.PI * 180, speed: 2 },
			// { sx: sx, sy: sy, },
			{ timer: 60, },
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
RotatingCrystalEntity.prototype.draw = function(ctx) {
	ctx.save();

	ctx.translate(this.px, this.py);
	ctx.rotate(Math.PI * (Math.floor(this.angle / 15) * 15) / 180);
	ctx.drawImage(this.img, 0 - this.width / 2, 0 - this.height / 2, this.width, this.height);

	ctx.restore();
};

function UFOCorsairEnemy(game, px, py) {
	ScreenEntity.call(this, game, px, py, 128, 64, game.images.ufo_corsair);
	this.crystal_ent = new RotatingCrystalEntity(game, 32, 0);
	this.angle = 0;
}
UFOCorsairEnemy.prototype = Object.create(ScreenEntity.prototype);
UFOCorsairEnemy.prototype.update = function(game) {
	this.crystal_ent.update(game);
	this.angle += 0.2;
};
UFOCorsairEnemy.prototype.draw = function(ctx) {
	ctx.save();

	ctx.translate(this.px, this.py);
	ctx.rotate(Math.PI * (Math.floor(this.angle / 15) * 15) / 180);
	ctx.drawImage(this.img, 0 - this.width / 2, 0 - this.height / 2, this.width, this.height);

	this.crystal_ent.draw(ctx);

	ctx.restore();
};

function EnemyBullet(game, px, py, path) {
	ScreenEntity.call(this, game, px, py, 16, 16, game.images.enemy_bullet_orange);

	this.path = path;
	this.current_action = undefined;
}
EnemyBullet.prototype = Object.create(ScreenEntity.prototype);
EnemyBullet.prototype.update = function(game) {
	if (this.current_action === undefined) {
		if (this.path.length > 0) {
			this.current_action = this.path.shift();
			if (this.current_action.delete !== undefined) {
				game.entities_to_remove.push(this);
			}

			if (this.current_action.px !== undefined) {
				this.current_action.sx = (this.current_action.px - this.px) / this.current_action.timer;
				this.current_action.sy = (this.current_action.py - this.py) / this.current_action.timer;
			}

			if (this.current_action.sx == undefined)
				this.current_action.sx = 0;
			if (this.current_action.sy == undefined)
				this.current_action.sy = 0;

			if (this.current_action.angle !== undefined) {
				this.current_action.sx = Math.cos(this.current_action.angle / 180 * Math.PI) * this.current_action.speed;
				this.current_action.sy = Math.sin(this.current_action.angle / 180 * Math.PI) * this.current_action.speed;
			}
		}
	} else {
		if (this.current_action.fda !== undefined) {
			this.current_action.da *= this.current_action.fda;
		}
		if (this.current_action.da !== undefined) {
			this.current_action.angle += this.current_action.da;
			this.current_action.sx = Math.cos(this.current_action.angle / 180 * Math.PI) * this.current_action.speed;
			this.current_action.sy = Math.sin(this.current_action.angle / 180 * Math.PI) * this.current_action.speed;
		}

		this.px += this.current_action.sx;
		this.py += this.current_action.sy;

		if (this.current_action.timer !== undefined) {
			this.current_action.timer--;
			if (this.current_action.timer <= 0)
				this.current_action = undefined;
		}
	}
};

function ParticleEffect(game, px, py, sx, sy, fill_style) {
	ScreenEntity.call(this, game, px, py, 8, 8, game.images.particle_effect_generic);
	this.sx = sx;
	this.sy = sy;
	
	this.frame = 0;
	this.fill_style = fill_style;
}
ParticleEffect.prototype = Object.create(ScreenEntity.prototype);
ParticleEffect.prototype.draw = function(ctx) {
	// ctx.save();

	var buffer_canvas = document.createElement('canvas');
	buffer_canvas.width = this.width;
	buffer_canvas.height = this.height;
	var buffer_context = buffer_canvas.getContext('2d');

	buffer_context.fillStyle = this.fill_style;
	buffer_context.fillRect(0,0, buffer_canvas.width, buffer_canvas.height);

	buffer_context.globalCompositeOperation = "destination-atop";
	buffer_context.drawImage(this.img, 8*this.frame,0, 8,8,  0,0, 8,8);

	// ctx.translate(this.px, this.py);
	// ctx.rotate(Math.PI * (Math.floor(this.angle / 15) * 15) / 180);
	ctx.drawImage(buffer_canvas, this.px - this.width, this.py - this.height, this.width * 2, this.height * 2);

	// ctx.restore();
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

		enemy_bullet_orange: "enemy_bullet_orange.png",
		enemy_bullet_overlay_effect: "enemy_bullet_overlay_effect.png",
		purple_crystal: "purple_crystal.png",
		particle_effect_generic: "particle_effect_generic.png",
	};

	load_all_images(images, function () {
		console.log("all images loaded");

		var game = new GameSystem(images);

		game.entities.push(new EnemyBullet(game, 8,8, 1,1));
		game.entities.push(new UFOEnemy(game, 100,100));
		game.entities.push(new UFOCorsairEnemy(game, 300,100));
		game.entities.push(new ParticleEffect(game, 300,200));

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



