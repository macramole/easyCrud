var operations = require("../operationTypes.js");

module.exports = {
	name : "password",
	postProcess : function(document, fieldName, operation) {
		var value = document[fieldName];
		console.log(operation);
		if ( operation == operations.EDIT && !value ) {
			delete document[fieldName];
			console.log("deleting");
		}
	}
}
