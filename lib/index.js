'use strict'

const Joi = require('joi')
const Schema = require('./schema')
const Models = require('./models')
const DB = require('./DB')
const Pkg = require('../package.json')
const Sequelize = require('sequelize')

// Module globals
const internals = {
  server: null,
}

const getLogCallback = (dbName) => {
  return (msg) => {
    internals.server.log(['sequelize', dbName], msg)
  }
}

const configure = async (options) => {
  let connectionString = options.database.dialect + '://'

  if (options.database.username && options.database.username !== '') {
    connectionString += options.username

    if (options.database.password && options.database.password !== '') {
      connectionString += ':' + options.database.password
    }

    connectionString += '@'
  }

  if (options.database.host && options.database.host !== '') {
    connectionString += options.database.host + '/'
  }

  connectionString += options.database.name

  const sequelize = new Sequelize(connectionString, Object.assign({
    logging: options.logging === true ? getLogCallback(options.name) : false,
  }, options.sequelizeOptions))

  await sequelize.authenticate()

  const files = Models.getFiles(options.models)
  const models = Models.applyRelations(Models.load(files, sequelize.import.bind(sequelize)))

  if (options.sync) {
    await sequelize.sync({ force: options.forceSync })
  }

  const database = new DB(sequelize, models)

  if (options.onConnect) {
    options.onConnect(sequelize)
  }

  internals.server.expose(options.name, database)
  return database
}

const register = (server, options) => {
  if (!options) throw new Error('Missing hapi-sequelize plugin options')
  if (!Array.isArray(options)) options = [options]
  internals.server = server

  const validation = Joi.validate(options, Schema.options)
  if (!validation || validation.error) throw validation.error

  const getDb = (request) => {
    return function getDb (name) {
      if (!name || !request.server.plugins[Pkg.name].hasOwnProperty(name)) {
        const key = Object.keys(request.server.plugins[Pkg.name]).shift()
        return request.server.plugins[Pkg.name][key]
      }
      return request.server.plugins[Pkg.name][name]
    }
  }

  server.decorate('request', 'getDb', getDb, { apply: true })

  return Promise.all(options.map(configure))
}

exports.plugin = {
  name: Pkg.name,
  version: Pkg.version,
  register: register,
  pkg: Pkg,
}
