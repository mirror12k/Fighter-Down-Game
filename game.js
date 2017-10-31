

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


function ScreenEntity(px, py, width, height, img) {
	this.px = px;
	this.py = py;
	this.width = width;
	this.height = height;
	this.img = img;
}

ScreenEntity.prototype.draw = function(ctx) {
	ctx.drawImage(this.img, this.px - this.width / 2, this.py - this.height / 2, this.width, this.height);
};

function EnemyBullet(px, py) {
	ScreenEntity.call(this, px, py, 16, 16, images.enemy_bullet_orange);
}
EnemyBullet.prototype = Object.create(ScreenEntity.prototype);

function main () {
	var canvas = document.querySelector('#game_canvas');
	var ctx = canvas.getContext('2d');

	ctx.clearRect(0, 0, 640, 480);

	ctx.fillStyle = 'rgb(200, 0, 0)';
	ctx.fillRect(10, 10, 50, 50);

	ctx.fillStyle = 'rgba(0, 0, 200, 0.5)';
	ctx.fillRect(30, 30, 50, 50);

	load_all_images(function () {
		console.log("all images loaded");
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

		var bullet = new EnemyBullet(8,8);
		bullet.draw(ctx);
	});
}


window.addEventListener('load', main);



