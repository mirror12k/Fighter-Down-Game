
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

function d2_point_offset(angle, px, py) {
	return {
		px: px * Math.cos(Math.PI * angle / 180) - py * Math.sin(Math.PI * angle / 180),
		py: py * Math.cos(Math.PI * angle / 180) + px * Math.sin(Math.PI * angle / 180),
	};
}

function point_angle(fromx, fromy, tox, toy) {
	var dx = tox - fromx;
	var dy = toy - fromy;
	var angle = Math.atan2(dy, dx);
	// console.log("angle: ", angle / Math.PI * 180);
	return angle / Math.PI * 180;
}

function GameSystem(canvas, images) {
	this.canvas = canvas;
	this.images = images;

	this.entities = [];
	this.entities_to_add = [];
	this.entities_to_remove = [];

	this.particle_systems = {};


	this.debug_time = { game_update_time: 0, game_draw_time: 0, game_entity_draw_time: {}, };
	this.debug_time_timer = 0;

	this.keystate = {
		W: false,
		A: false,
		S: false,
		D: false,
		' ': false,
		shift: false,
		ctrl: false,
		alt: false,
	};
	this.mouse1_state = false;
	this.mouse_position = { px: 0, py: 0 };

	document.addEventListener('keydown', (function (e) {
		e = e || window.event;
		e.preventDefault();
		var charcode = String.fromCharCode(e.keyCode);
		this.keystate[charcode] = true;
		this.keystate.shift = !!e.shiftKey;
		this.keystate.ctrl = !!e.ctrlKey;
		this.keystate.alt = !!e.altKey;
		// console.log('keydown: ', charcode);
	}).bind(this));

	document.addEventListener('keyup', (function (e) {
		e = e || window.event;
		e.preventDefault();
		var charcode = String.fromCharCode(e.keyCode);
		this.keystate[charcode] = false;
		this.keystate.shift = !!e.shiftKey;
		this.keystate.ctrl = !!e.ctrlKey;
		this.keystate.alt = !!e.altKey;
		// console.log('keyup: ', charcode);
	}).bind(this));

	var self = this;
	this.canvas.addEventListener('mousedown', function (e) {
		var x = e.x - this.getBoundingClientRect().left;
		var y = e.y - this.getBoundingClientRect().top;
		self.mouse_position = { px: x, py: y };
		self.mouse1_state = true;
		// console.log("mousedown: ", x, y);
	});
	this.canvas.addEventListener('mouseup', function (e) {
		var x = e.x - this.getBoundingClientRect().left;
		var y = e.y - this.getBoundingClientRect().top;
		self.mouse_position = { px: x, py: y };
		self.mouse1_state = false;
		// console.log("mouseup: ", x, y);
	});
	this.canvas.addEventListener('mousemove', function (e) {
		var x = e.x - this.getBoundingClientRect().left;
		var y = e.y - this.getBoundingClientRect().top;
		self.mouse_position = { px: x, py: y };
		// console.log("mousemove: ", x, y);
	});
}
GameSystem.prototype.step_game_frame = function(ctx) {
	var self = this;
	// console.log('step');

	this.debug_time_timer++;
	if (this.debug_time_timer >= 120) {
		this.debug_time_timer = 0;
		// Object.keys(this.debug_time.game_entity_draw_time).forEach(function (k) { self.debug_time.game_entity_draw_time[k] /= 120; });
		// console.log("time: ", this.debug_time.game_entity_draw_time); // DEBUG_TIME
		// console.log("frame time; update:", this.debug_time.game_update_time / 120, "draw:", this.debug_time.game_draw_time / 120); // DEBUG_TIME
		this.debug_time.game_update_time = 0;
		this.debug_time.game_draw_time = 0;
		this.debug_time.game_entity_draw_time = {};
	}

	// var start = new Date().getTime(); // DEBUG_TIME
	this.update();
	// this.debug_time.game_update_time += new Date().getTime() - start; // DEBUG_TIME
	
	// start = new Date().getTime(); // DEBUG_TIME
	this.draw(ctx);
	// this.debug_time.game_draw_time += new Date().getTime() - start; // DEBUG_TIME
};
GameSystem.prototype.update = function () {

	for (var i = 0; i < this.entities_to_remove.length; i++) {
		var index = this.entities.indexOf(this.entities_to_remove[i]);
		if (index >= 0)
			this.entities.splice(index, 1);
	}
	this.entities_to_remove = [];

	for (var i = 0; i < this.entities_to_add.length; i++)
		this.entities.push(this.entities_to_add[i]);
	this.entities_to_add = [];

	for (var i = 0; i < this.entities.length; i++) {
		this.entities[i].update(this);
	}

	var keys = Object.keys(this.particle_systems);
	for (var i = 0; i < keys.length; i++) {
		this.particle_systems[keys[i]].update(this);
	}
};
GameSystem.prototype.draw = function (ctx) {
	ctx.clearRect(0, 0, 640, 480);

	ctx.fillStyle = 'rgb(0, 0, 0)';
	ctx.fillRect(0, 0, 640, 480);

	for (var i = 0; i < this.entities.length; i++) {
		// var start = new Date().getTime(); // DEBUG_TIME
		this.entities[i].draw(ctx);
		// this.debug_time.game_entity_draw_time[this.entities[i].class_name] = // DEBUG_TIME
			// (this.debug_time.game_entity_draw_time[this.entities[i].class_name] || 0) + new Date().getTime() - start; // DEBUG_TIME
	}

	var keys = Object.keys(this.particle_systems);
	for (var i = 0; i < keys.length; i++) {
		// var start = new Date().getTime(); // DEBUG_TIME
		this.particle_systems[keys[i]].draw(ctx);
		// this.debug_time.game_entity_draw_time[this.particle_systems[keys[i]].class_name] = // DEBUG_TIME
			// (this.debug_time.game_entity_draw_time[this.particle_systems[keys[i]].class_name] || 0) + new Date().getTime() - start; // DEBUG_TIME
	}

	for (var i = 0; i < this.entities.length; i++) {
		this.entities[i].draw_ui(ctx);
	}
};

GameSystem.prototype.find_near = function(me, type, dist) {
	var found = [];
	for (var i = 0; i < this.entities.length; i++) {
		var ent = this.entities[i];
		if (ent instanceof type) {
			if (Math.abs(ent.px - me.px) < dist && Math.abs(ent.py - me.py) < dist &&
				Math.pow(Math.pow(ent.px - me.px, 2) + Math.pow(ent.py - me.py, 2), 0.5) < dist) {
				found.push(ent);
			}
		}
	}

	return found;
};


function Entity(game) {
	this.sub_entities = [];
	this.ui_entities = [];
}
Entity.prototype.class_name = 'Entity';
Entity.prototype.update = function(game) {
	for (var i = 0; i < this.sub_entities.length; i++) {
		this.sub_entities[i].update(game);
	}
};
Entity.prototype.draw = function(ctx) {
	for (var i = 0; i < this.sub_entities.length; i++) {
		this.sub_entities[i].draw(ctx);
	}
};
Entity.prototype.draw_ui = function(ctx) {
	for (var i = 0; i < this.ui_entities.length; i++) {
		this.ui_entities[i].draw(ctx);
	}
};

function ScreenEntity(game, px, py, width, height, img) {
	Entity.call(this, game);
	this.px = px;
	this.py = py;
	this.angle = 0;
	this.frame = 0;
	this.max_frame = 1;
	this.width = width;
	this.height = height;
	this.img = img;

	this.rotation = 0;
	this.angle_granularity = 15;
}
ScreenEntity.prototype = Object.create(Entity.prototype);
ScreenEntity.prototype.class_name = 'ScreenEntity';
ScreenEntity.prototype.draw = function(ctx) {
	// ctx.drawImage(this.img, this.px - this.width / 2, this.py - this.height / 2, this.width, this.height);
	ctx.save();

	ctx.translate(this.px, this.py);
	ctx.rotate(Math.PI * (Math.floor(this.angle / this.angle_granularity) * this.angle_granularity) / 180);
	ctx.drawImage(this.img,
		this.frame * (this.img.width / this.max_frame), 0, this.img.width / this.max_frame, this.img.height,
		0 - this.width / 2, 0 - this.height / 2, this.width, this.height);

	Entity.prototype.draw.call(this, ctx);
	ctx.restore();
};
ScreenEntity.prototype.update = function(game) {
	Entity.prototype.update.call(this, game);
	if (this.rotation) {
		this.angle += this.rotation;
		this.angle %= 360;
	}
};
Entity.prototype.draw_ui = function(ctx) {
	ctx.save();
	ctx.translate(this.px, this.py);
	for (var i = 0; i < this.ui_entities.length; i++) {
		this.ui_entities[i].draw(ctx);
	}
	ctx.restore();
};



function ParticleEffectSystem(game, config) {
	this.fill_style = config.fill_style;
	this.particle_image = config.particle_image || game.images.particle_effect_generic;

	this.particles = [];

	this.width = 32;
	this.height = 8;
	this.frame_width = 8;
	this.max_frame = config.max_frame || (this.width / this.frame_width);

	this.particle_width = config.particle_size || 16;
	this.particle_height = config.particle_size || 16;

	this.particle_longevity = config.particle_longevity || 0.05;
	this.particle_respawn = config.particle_respawn || 0;
	this.dynamic_images = config.dynamic_images;

	if (this.fill_style !== undefined && !this.dynamic_images)
		this.prepare_buffer();
}
ParticleEffectSystem.prototype = Object.create(ScreenEntity.prototype);
ParticleEffectSystem.prototype.class_name = 'ParticleEffectSystem';
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
ParticleEffectSystem.prototype.add_image_particle = function(image, width, height, px, py, speed) {
	var sx = ((Math.random() - 0.5) * speed) ** 2 - ((Math.random() - 0.5) * speed) ** 2;
	var sy = ((Math.random() - 0.5) * speed) ** 2 - ((Math.random() - 0.5) * speed) ** 2;

	var sourcex = image.width * (Math.random() * 0.5);
	var sourcey = image.height * (Math.random() * 0.5);
	var width = width * (Math.random() * 0.25 + 0.25);
	var height = height * (Math.random() * 0.25 + 0.25);

	// var offsetx = Math.random() * width - width / 2;
	// var offsety = Math.random() * height - height / 2;

	this.particles.push({
		image: image,
		sourcex: sourcex,
		sourcey: sourcey,
		width: width,
		height: height,
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

		if (Math.random() < this.particle_longevity) {
			this.particles[i].frame++;
			if (this.particles[i].frame >= this.max_frame) {
				if (Math.random() < this.particle_respawn) {
					this.particles[i].frame = 0;
				} else {
					this.particles.splice(i, 1);
				}
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
		if (this.dynamic_images) {
			ctx.drawImage(p.image, 
				p.sourcex, p.sourcey, p.width, p.height,
				// this.frame_width * p.frame, 0, this.frame_width, this.height,
				0 - p.width / 2, 0 - p.height / 2, p.width, p.height);
		} else if (this.fill_style !== undefined) {
			ctx.drawImage(this.buffer_canvas, 
				this.frame_width * p.frame, 0, this.frame_width, this.height,
				0 - width / 2, 0 - height / 2, width, height);
		} else {
			ctx.drawImage(this.particle_image, 
				this.frame_width * p.frame, 0, this.frame_width, this.height,
				0 - width / 2, 0 - height / 2, width, height);
		}

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
PathEntity.prototype.class_name = 'PathEntity';
PathEntity.prototype.trigger_path_action = function(game) {
	if (this.current_action.delete !== undefined) {
		game.entities_to_remove.push(this);
	}

	if (this.current_action.px !== undefined) {
		if (this.current_action.timeout !== undefined) {
			this.current_action.sx = (this.current_action.px - this.px) / this.current_action.timeout;
			this.current_action.sy = (this.current_action.py - this.py) / this.current_action.timeout;
			this.timer = this.current_action.timeout;
		} else {
			var dist = ((this.current_action.px - this.px) ** 2 + (this.current_action.py - this.py) ** 2) ** 0.5;
			var normalx = (this.current_action.px - this.px) / dist;
			var normaly = (this.current_action.py - this.py) / dist;
			this.current_action.sx = normalx * this.current_action.speed;
			this.current_action.sy = normaly * this.current_action.speed;
			this.timer = dist / this.current_action.speed;
		}
	} else {
		if (this.current_action.angle !== undefined) {
			this.angle = this.current_action.angle;
			if (this.current_action.speed !== undefined) {
				this.current_action.sx = Math.cos(this.current_action.angle / 180 * Math.PI) * this.current_action.speed;
				this.current_action.sy = Math.sin(this.current_action.angle / 180 * Math.PI) * this.current_action.speed;
			}
		}

		if (this.current_action.timeout !== undefined) {
			this.timer = this.current_action.timeout;
		} else {
			this.timer = undefined;
		}
	}


	if (this.current_action.sx === undefined)
		this.current_action.sx = 0;
	if (this.current_action.sy === undefined)
		this.current_action.sy = 0;



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

	if (this.current_action.call_system) {
		for (var i = 0; i < this.current_action.call_system.length; i++) {
			var args = this.current_action.call_system[i].args || [];
			args = args.slice(0);
			args.unshift(game);
			game[this.current_action.call_system[i].system][this.current_action.call_system[i].method].apply(
					game[this.current_action.call_system[i].system], args);
		}
	}
};
PathEntity.prototype.update = function(game) {
	ScreenEntity.prototype.update.call(this, game);
	if (this.path === undefined) {
		// do nothing
	} else if (this.current_action === undefined) {
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
				game.particle_systems[this.current_action.trail.type].add_particle(this.px, this.py, 2);
			}
		}

		this.px += this.current_action.sx;
		this.py += this.current_action.sy;

		if (this.timer !== undefined) {
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
