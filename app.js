var walk = require('walk');
var express = require('express');
var jade = require('jade');
var path = require('path');
var fieldManager = require('./fieldManager.js');
var mongoose = require("mongoose");

var models = {};

var appRoot = require('app-root-path');
var PATH_MODELS = appRoot + "/app/models/";

var mainURIPath = "/admin";

var ACTION_CREATE = 'create';
var ACTION_EDIT = 'edit';
var ACTION_LIST = 'list';
var ACTION_NO_ACTION = '';

var operations = require("./operationTypes.js");

var ignoreModels = [];

function populateModels() {
	var walker = walk.walk(PATH_MODELS);

	walker.on("file", function(root, fileStat, next) {
		var model = require(PATH_MODELS + fileStat.name);
		if ( !model.easycrud || !model.easycrud.ignore ) {
			models[model.modelName] = model;
		}
		next();
	});
}

function viewCRUDPath(view) {
	return path.join(__dirname, '/views/crud/' + view + ".jade")
}

function renderForm(res, operation, modelName, fields, id) {
	res.render( viewCRUDPath('form') , { "fields" : fields, templateRender: jade.renderFile, modelName : modelName, operation : operation, id:id } );
}

function renderList(res, modelName, modelFields, rows) {
	res.render( viewCRUDPath('list') , { modelFields : modelFields, rows : rows, modelName : modelName } );
}

module.exports = {
	ignoreModels : function(arrModels) {
		ignoreModels = arrModels;
	},
	init : function(app) {
		populateModels();
		app.use('/easycrud', express.static(__dirname + '/public/'));
		app.use(mainURIPath, function(req,res,next) {
			var arrPath = req.path.split("/");

			//this should be done different
			if ( !req.user || req.user.role != 1 ) {
				res.send("No autorizado");
				next();
				return;
			}

			if ( models[ arrPath[1] ] ) {
				var model = models[ arrPath[1] ];
				var action = ACTION_NO_ACTION;

				if ( req.method == "GET" ) {
					action = arrPath[2];
				}

				switch( req.method ) {
					case "GET":
						switch ( action ) {
							case ACTION_CREATE:
								var fields = fieldManager.getFieldsFor(model);
								renderForm(res, operations.CREATE, model.modelName, fields);
								break;
							case ACTION_LIST:
								var modelFields = fieldManager.getModelFields(model);

								model.find({}, function(err, rows) {
									if ( err ) {
										res.send(err);
									} else {
										renderList(res, model.modelName, modelFields, rows);
									}
								});
								break;
							case ACTION_EDIT:
								var objectID = arrPath[3];
								if ( objectID ) {
									var fields = fieldManager.getFieldsFor(model);

									model.findById(objectID, function(err, document) {
										if ( err ) {
											res.end(err);
										} else {
											for ( field in fields ) {
												fields[field].value = document[ fields[field].name ];
											}
											renderForm(res, operations.EDIT, model.modelName, fields, objectID);
										}
									});
								} else {
									res.end("No objectID found.");
								}
								break;
						}
						break;
					case "POST":
						var modelFields = fieldManager.getModelFields(model);
						var objectToSave = {};
						modelFields.forEach( function(field) {
							objectToSave[field] = req.body[field];
						} );

						fieldManager.postProcessFields(model, objectToSave, operations.CREATE);

						model.create( objectToSave, function(err, newRow) {
							if ( err ) {
								res.send({
									status : "error",
									message : err
								});
							} else {
								res.send({
									status : "ok"
								});
							}
						});
						break;
					case "DELETE":
						var objectID = req.body.id;
						if ( objectID ) {
							model.findByIdAndRemove(objectID, function(err, deletedObject) {
								res.send({
									status : "ok"
								});
							});
						} else {
							res.send({
								status : "error",
								message : "No ObjectID. What should I delete?"
							});
						}
						break;
					case "PUT":
						var objectID = req.body.id;
						if ( objectID ) {
							var modelFields = fieldManager.getModelFields(model);
							var objectToUpdate = {};
							modelFields.forEach( function(field) {
								objectToUpdate[field] = req.body[field];
							} );
							fieldManager.postProcessFields(model, objectToUpdate, operations.EDIT);

							model.findByIdAndUpdate( objectID, objectToUpdate, function(err, updatedDocument) {
								if ( err ) {
									errorMessage = err.message;

									if ( err.name == "CastError" ) {
										errorMessage = "El valor del campo '" + err.path + "' debe ser del tipo '" + err.kind + "'";
									}

									res.send({
										status : "error",
										message : errorMessage
									});
								} else {
									res.send({
										status : "ok"
									});
								}
							} );
						} else {
							res.send({
								status : "error",
								message : "No ObjectID. What should I delete?"
							});
						}
						break;
				}
			} else {
				res.end("Model not found");
			}

			//next();
		});
	},

	getNavInfo : function() {
		var navInfo = [];
		for ( model in models ) {
			navInfo.push({
				name : model,
				listPath : mainURIPath + "/" + model + "/list",
				createPath : mainURIPath + "/" + model + "/create",
			});
		}
		return navInfo;
	}
};
