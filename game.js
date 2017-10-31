

function load_image (url, callback) {
	var img = new Image();
	img.onload = callback.bind(undefined, img);
	img.src = url;
}

var images = {
	fighter: "fighter.png",
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

function main () {
	var canvas = document.querySelector('#game_canvas');
	var ctx = canvas.getContext('2d');

	ctx.fillStyle = 'rgb(200, 0, 0)';
	ctx.fillRect(10, 10, 50, 50);

	ctx.fillStyle = 'rgba(0, 0, 200, 0.5)';
	ctx.fillRect(30, 30, 50, 50);

	load_all_images(function () {
		console.log("all images loaded");
		ctx.drawImage(images.fighter, 0, 0, 64, 64);
		ctx.drawImage(images.fighter, 20, 20, 256, 256);
	});
}


window.addEventListener('load', main);



