var file = require('file'),
	path = require('path'),
	es = require('event-stream');

var gulp = require('gulp'),
	gutil = require('gulp-util'),
	plugins = require("gulp-load-plugins")({
	    pattern: ['gulp-*', 'gulp.*'],
	    replaceString: /\bgulp[\-.]/
	});

var app = 'app',
	src = 'js',
	buildDest = 'build/js',
	srcDest = path.join(buildDest, 'modules'),
	appModule = 'core',
	tasks = ['scripts'],
	ignoreDirs = ['test', 'libs'];

var isProduction = gutil.env.prod || false;


/**
 * @returns An object
 * 
 * Each key is the module name and the value
 * is an array of files associated with that module.
 * 
 * The files 
 */
function getModules(src, app, ignore) {
	
	var modules = {}
	
	file.walkSync(src, function(dirPath, dirs, files) {
		
		if(files.length < 1)
			return;
		
		var dir = path.basename(dirPath)
			module;
		
		if(ignore.indexOf(dir) === -1) {
			
			module = dirPath === src ? app : dir;
			
			/*
			 * sort to ensure module definition file is first
			 */
			files = files.sort(function(a, b) {
				return path.basename(a, '.js') === module ? -1 : 1;
			})
			/*
			 * remove hidden files
			 */
			.filter(function(value) {
				return value.indexOf('.') !== 0;
			})
			.map(function(value) {
				return path.join(dirPath, value);
			})
			
			modules[module] = files;
		}
	})
	
	return modules;
}

/**
 * @param modules An object
 * 
 * Combines the base app files with a specified app module
 */
function preprocessModules(modules) {
	
	if(appModule) {
		
		var am = modules[appModule];
		delete modules[appModule];
		
		modules[app] = modules[app].concat(am);
	}
	
	return modules;
}


gulp.task('prepare-modules', function() {
	
	var modules = getModules(src, app, ignoreDirs);
	modules = preprocessModules(modules);
	
	var module,
		tasks = [];
	
	for(module in modules) {
		tasks.push(
			gulp.src(modules[module])
				.pipe(plugins.jsbeautifier())
				.pipe(plugins.ngAnnotate())
				.pipe(plugins.concat(module + '.js'))
				.pipe(plugins.wrap('(function(){\n"use strict";\n<%= contents %>\n})();'))
				.pipe(plugins.size())
				.pipe(gulp.dest(srcDest))
		);
	}
	
	return es.concat.apply(null, tasks);
});


gulp.task('scripts', ['prepare-modules'], function() {
	
	return gulp.src([
	           path.join(srcDest, app + '.js'),
	           path.join(srcDest, '*.js')
	       ])
	       .pipe(plugins.if(isProduction, plugins.sourcemaps.init()))
	         .pipe(plugins.if(isProduction, plugins.uglify()))
	         .pipe(plugins.concat(isProduction ? 'build.min.js' : 'build.js'))
	       .pipe(plugins.if(isProduction, plugins.sourcemaps.write('../maps')))
	       .pipe(plugins.size())
		   .pipe(gulp.dest(buildDest));
});



gulp.task('default', tasks, function(){
	
		gulp.watch(
			'js/**/*js',
			tasks
		);
	}
);