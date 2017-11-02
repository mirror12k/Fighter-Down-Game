

function load_image (url, callback) {
	var img = new Image();
	img.onload = callback.bind(undefined, img);
	img.src = url;
}

var images = {
	fighter: "fighter.png",
	mini_fighter: "mini_fighter.png",
	fighter_attack_formation: "fighter_attack_formation.png",
	fighter_transform_animation: "fighter_transform_animation.png",
	enemy_bullet_orange: "enemy_bullet_orange.png",
	enemy_bullet_overlay_effect: "enemy_bullet_overlay_effect.png",
	ufo: "ufo.png",
	ufo_small: "ufo_small.png",
};

function load_all_images (callback) {
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


function Entity() {}
Entity.prototype.update = function(entities) {};
Entity.prototype.draw = function(ctx) {};

function ScreenEntity(px, py, width, height, img) {
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

function UFOEnemy(px, py) {
	ScreenEntity.call(this, px, py, 64, 64, images.ufo);
	this.rotation = 0;
}
UFOEnemy.prototype = Object.create(ScreenEntity.prototype);
UFOEnemy.prototype.draw = function(ctx) {
	ctx.save();

	ctx.translate(this.px, this.py);
	ctx.rotate(Math.PI * (Math.floor(this.rotation / 15) * 15) / 180);
	ctx.drawImage(this.img, 0 - this.width / 2, 0 - this.height / 2, this.width, this.height);

	ctx.restore();
};
UFOEnemy.prototype.update = function(entities) {
	this.rotation += 1;
	this.rotation %= 360;
	if (this.rotation == 180) {
		this.fire(entities, 100, 200);
	}
};

UFOEnemy.prototype.fire = function(entities, tx, ty) {
	var dx = tx - this.px;
	var dy = ty - this.py;
	var angle = Math.atan2(dy, dx);
	console.log("angle: ", angle / Math.PI * 180);

	// entities.push(new EnemyBullet(tx, ty, 0,0));

	var sx = Math.cos(angle) * 2;
	var sy = Math.sin(angle) * 2;

	for (var a = 0; a < 360; a += 30) {
		var bx = Math.cos(a / 180 * Math.PI) * 40;
		var by = Math.sin(a / 180 * Math.PI) * 40;

		entities.push(new EnemyBullet(this.px + bx, this.py + by, sx,sy));
	}
};

function EnemyBullet(px, py, sx, sy) {
	ScreenEntity.call(this, px, py, 16, 16, images.enemy_bullet_orange);
	this.sx = sx;
	this.sy = sy;
}
EnemyBullet.prototype = Object.create(ScreenEntity.prototype);
EnemyBullet.prototype.update = function(entities) {
	this.px += this.sx;
	this.py += this.sy;
};

function main () {
	var canvas = document.querySelector('#game_canvas');
	var ctx = canvas.getContext('2d');

	load_all_images(function () {
		console.log("all images loaded");

		var entities = [];

		entities.push(new EnemyBullet(8,8, 1,1));
		entities.push(new UFOEnemy(100,100));

		setInterval(step_game_frame.bind(undefined, ctx, entities), 1000 / 60);
	});
}

function draw_entities(ctx, entities)
{
	ctx.clearRect(0, 0, 640, 480);

	ctx.fillStyle = 'rgb(200, 0, 0)';
	ctx.fillRect(10, 10, 50, 50);

	ctx.fillStyle = 'rgba(0, 0, 200, 0.5)';
	ctx.fillRect(30, 30, 50, 50);

	ctx.drawImage(images.fighter, 0, 0, 64, 64);
	// ctx.drawImage(images.mini_fighter, 20, 20, 256, 256);
	ctx.drawImage(images.fighter_transform_animation, 0 + 64 * 0, 0, 64, 64, 20 + 64 * 0, 20, 64, 64);
	ctx.drawImage(images.fighter_transform_animation, 0 + 64 * 1, 0, 64, 64, 20 + 64 * 1, 20, 64, 64);
	ctx.drawImage(images.fighter_transform_animation, 0 + 64 * 2, 0, 64, 64, 20 + 64 * 2, 20, 64, 64);
	ctx.drawImage(images.fighter_transform_animation, 0 + 64 * 3, 0, 64, 64, 20 + 64 * 3, 20, 64, 64);
	ctx.drawImage(images.fighter_transform_animation, 0 + 64 * 4, 0, 64, 64, 20 + 64 * 4, 20, 64, 64);
	ctx.drawImage(images.fighter_transform_animation, 0 + 64 * 5, 0, 64, 64, 20 + 64 * 5, 20, 64, 64);
	ctx.drawImage(images.fighter_transform_animation, 0 + 64 * 6, 0, 64, 64, 20 + 64 * 6, 20, 64, 64);
	ctx.drawImage(images.fighter_transform_animation, 0 + 64 * 7, 0, 64, 64, 20 + 64 * 7, 20, 64, 64);

	for (var i = 0; i < entities.length; i++) {
		entities[i].draw(ctx);
	}
}

function update_entities(entities)
{
	for (var i = 0; i < entities.length; i++) {
		entities[i].update(entities);
	}
}

function step_game_frame(ctx, entities)
{
	// console.log('step');

	update_entities(entities);

	draw_entities(ctx, entities);
}


window.addEventListener('load', main);



