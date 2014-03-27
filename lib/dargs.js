/*
	https://github.com/sindresorhus/dargs
	dargs with camel-case changes removed
*/
 
'use strict';

/*
	https://gist.github.com/penguinboy/762197
	Thanks, penguinboy!
 */
var flattenObject = function(ob) {
	var toReturn = {};
	Object.keys(ob).forEach(function(key){
		if (!ob.hasOwnProperty(key)) return;
		if ((typeof ob[key]) == 'object') {
			var flatObject = flattenObject(ob[key]);
			Object.keys(flatObject).forEach(function(key2){
				if (!flatObject.hasOwnProperty(key2)) return;
				toReturn[key + '.' + key2] = flatObject[key2];
			})
		} else {
			toReturn[key] = ob[key];
		}
	})
	return toReturn;
};
module.exports = function (options, excludes) {
	var args = [];
	Object.keys(options).forEach(function (key) {
		var flag;
		var val = options[key];

		if (Array.isArray(excludes) && excludes.indexOf(key) !== -1) {
			return;
		}

		flag = key;//.replace(/[A-Z]/g, '-$&').toLowerCase();

		if (val === true) {
			args.push('--' + flag);
		}

		if (typeof val === 'string') {
			args.push('--' + flag, val);
		}

		if (typeof val === 'number' && isNaN(val) === false) {
			args.push('--' + flag, '' + val);
		}
		if(typeof val === 'object' && !Array.isArray(val)){
			var flattened=flattenObject(val)
			Object.keys(flattened).forEach(function(k){
				args.push('--' + flag+'.'+k, flattened[k]);
			})
		}else if (Array.isArray(val)) {
			val.forEach(function (arrVal) {
				args.push('--' + flag, arrVal);
			});
		}
	});

	return args;
};
