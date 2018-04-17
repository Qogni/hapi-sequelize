'use strict'

const Joi = require('joi')

const internals = {}

const databaseSchema = Joi.object().keys({
  dialect: Joi.allow(['mssql', 'mysql', 'postgres', 'sqlite']).required(),
  host: Joi.string().allow(''),
  username: Joi.string().allow(''),
  password: Joi.string().allow(''),
  name: Joi.string().required(),
})

internals.option = exports.option = Joi.object().keys({
  name: Joi.string().token().required(),
  database: databaseSchema,
  models: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
  sync: Joi.boolean().default(false),
  forceSync: Joi.boolean().default(false),
  logging: Joi.boolean().default(true),
  sequelizeOptions: Joi.object(),
  onConnect: Joi.func().arity(1),
})

exports.options = Joi.alternatives().try(Joi.array().items(internals.option), internals.option)
