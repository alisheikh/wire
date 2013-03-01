/** @license MIT License (c) copyright B Cavalier & J Hann */

/**
 * plugins
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 * @author: brian@hovercraftstudios.com
 */
(function(define) {
define(function(require) {

	var when, array, object, nsKey, nsSeparator;

	when = require('when');
	array = require('../array');
	object = require('../object');

	nsKey = '$ns';
	nsSeparator = ':';

	var registry = {
		isPlugin: isPlugin,

		scanModule: function(module, spec) {
			var self;

			if (allowPlugin(module, this.plugins)) {
				// Add to singleton plugins list to only allow one instance
				// of this plugin in the current context.
				this.plugins.push(module.wire$plugin);

				// Initialize the plugin for this context
				self = this;
				return when(module.wire$plugin(this.scopeReady, this.scopeDestroyed, spec),
					function(plugin) {
						var namespace = getNamespace(spec, self._namespaces);
						plugin && self.registerPlugin(plugin, namespace);
					}
				).yield(module);
			}

			return module;
		},

		registerPlugin: function(plugin, namespace) {
			addPlugin(plugin.resolvers, this.resolvers, namespace);
			addPlugin(plugin.factories, this.factories, namespace);
			addPlugin(plugin.facets, this.facets, namespace);

			this.listeners.push(plugin);

			this._registerProxies(plugin.proxies);
		},

		_registerProxies: function(proxiesToAdd) {
			if (!proxiesToAdd) {
				return;
			}

			var proxiers = this.proxiers;

			proxiesToAdd.forEach(function(p) {
				if (proxiers.indexOf(p) < 0) {
					proxiers.unshift(p);
				}
			});
		}
	};

	return createRegistry;

	function createRegistry(parent, ready, destroyed) {
		return Object.create(registry, {
			scopeReady: { value: ready },
			scopeDestroyed: { value: destroyed },

			plugins:   { value: [] },
			_namespaces: { value: {} },

			listeners: { value: array.delegate(parent.listeners) },
			proxiers:  { value: array.delegate(parent.proxiers) },
			resolvers: { value: object.inherit(parent.resolvers) },
			factories: { value: object.inherit(parent.factories) },
			facets:    { value: object.inherit(parent.facets) }
		});
	}

	function getNamespace(spec, namespaces) {
		var namespace;
		if(typeof spec === 'object' && nsKey in spec) {
			// A namespace was provided
			namespace = spec[nsKey];
			if(namespace && namespace in namespaces) {
				throw new Error('plugin namespace already in use: ' + namespace);
			} else {
				namespaces[namespace] = 1;
			}
		}

		return namespace;
	}

	function allowPlugin(module, existing) {
		return isPlugin(module) && existing.indexOf(module.wire$plugin) === -1;
	}

	function isPlugin(module) {
		return module && typeof module.wire$plugin == 'function'
	}

	function addPlugin(src, registry, namespace) {
		var newPluginName, namespacedName;
		for (newPluginName in src) {
			namespacedName = makeNamespace(newPluginName, namespace);
			if (object.hasOwn(registry, namespacedName)) {
				throw new Error("Two plugins for same type in scope: " + namespacedName);
			}

			registry[namespacedName] = src[newPluginName];
		}
	}

	function makeNamespace(pluginName, namespace) {
		return namespace ? (namespace + nsSeparator + pluginName) : pluginName;
	}
});
}(typeof define === 'function' ? define : function(factory) { module.exports = factory(require); }));