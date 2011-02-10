define(['dojo', 'dojo/parser'], function(dojo, parser) {
	var parsed = false;
	
	return {
		wire$resolvers: {
			/*
				Function: dijit
				Resolver for dijits by id.
				
				Parameters:
					factory - wire factory
					name - id of the dijit
					refObj - the complete $ref object
					promise - promise to resolve with the found dijit
			*/
			dijit: function(factory, name, refObj, promise) {
				dojo.ready(
					function() {
						var resolved = dijit.byId(name);
						if(resolved) {
							promise.resolve(resolved);
						} else {
							promise.unresolved();
						}
					}
				);
			}
		},
		wire$setters: [
			function setDijitProperty(object, property, value) {
				if(typeof object.set == 'function') {
					object.set(property, value);
					return true;
				}

				return false;
			}
		],
		wire$onWire: function onWire(ready, destroy) {
			// Only ever parse the page once, even if other child
			// contexts are created with this plugin present.
			if(!parsed) {
				parsed = true;
				dojo.ready(function() { parser.parse(); });
			}

			ready.then(null, null, function onObjectCreate(progress) {
				if(progress.status == "create" && typeof progress.target.declaredClass == 'string') {
					var object = progress.target,
						factory = progress.factory;

					// Prefer destroyRecursive over destroy
					if(typeof object.destroyRecursive == 'function') {
						factory.addDestroy(function destroyDijitRecursive() {
							object.destroyRecursive();
						});

					} else if(typeof object.destroy == 'function') {
						factory.addDestroy(function destroyDijit() {
							object.destroy();
						});

					}
				}
			})
		}
	};
});