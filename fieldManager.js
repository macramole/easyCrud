var path = require('path');

var defaultFields = {
	"String" : "textField",
	"Number" : "textField"
}

var EXCLUDE_FIELDS = ['_id', '__v'];

function viewFieldPath(field) {
	return path.join(__dirname, '/views/fields/' + field + ".jade")
}

module.exports = {
	getModelFields : function(model) {
		var fields = [];

		model.schema.eachPath( function(path) {
			if ( EXCLUDE_FIELDS.indexOf(path) == -1 ) {
				var field = module.exports.getFieldFor(model, path);

				if ( field ) {
					fields.push(path);
				}
			}
		} );

		return fields;
	},

	getFieldsFor : function(model) {
		var fields = [];

		model.schema.eachPath( function(path) {
			if ( EXCLUDE_FIELDS.indexOf(path) == -1 ) {
				var field = module.exports.getFieldFor(model, path);

				if ( field ) {
					fields.push({
						"name" : path,
						"field" : field
					});
				}
			}
		} );

		return fields;
	},
	getFieldFor : function(model, field) {
		var resultField = null;

		if ( model.schema.tree[field] && model.schema.tree[field].easycrud ) {
			resultField = model.schema.tree[field].easycrud;
		} else {
			var type = model.schema.paths[field].instance;
			resultField = defaultFields[type];
		}

		if ( resultField ) {
			return {
				name : resultField,
				view: viewFieldPath(resultField)
			};
		}

		return null;
	},

	postProcessFields : function( model, document, operation ) {
		var fields = module.exports.getFieldsFor(model);

		fields.forEach( function( fieldInfo ) {
			if ( typeof document[ fieldInfo.name ] != 'undefined' ) {
				var fieldDefinition = require("./fields/" + fieldInfo.field.name + ".js" );

				if ( fieldDefinition.postProcess ) {
					fieldDefinition.postProcess(document, fieldInfo.name, operation);
				}
			}
		});
	}
}
