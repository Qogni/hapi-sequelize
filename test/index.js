'use strict'

const Pkg = require('../package.json')
const Lab = require('lab')
const Code = require('code')
const Sinon = require('sinon')
const Hapi = require('hapi')
const Sequelize = require('sequelize')
const HapiSequelize = require('../lib')

const lab = exports.lab = Lab.script()
const test = lab.test
const expect = Code.expect

lab.suite('hapi-sequelize', () => {
  test('plugin works', { parallel: true }, async () => {
    const server = new Hapi.Server()

    const onConnect = (database) => {
      server.log('onConnect called')
    }

    const spy = Sinon.spy(onConnect)

    try {
      await server.register(Object.assign(HapiSequelize, {
        options: [
          {
            name: 'shop',
            database: {
              dialect: 'sqlite',
              name: 'database_' + process.env.NODE_ENV + '.sqlite',
            },
            models: ['./test/models/**/*.js'],
            sync: true,
            forceSync: true,
            onConnect: spy,
          },
        ],
      }))

      expect(server.plugins[Pkg.name]['shop'].sequelize).to.be.an.instanceOf(Sequelize)
      expect(spy.getCall(0).args[0]).to.be.an.instanceOf(Sequelize)

      let tables = await server.plugins[Pkg.name]['shop'].sequelize.query('SELECT name FROM sqlite_master WHERE type=\'table\'', { type: Sequelize.QueryTypes.SELECT })
      expect(tables.filter(table => !table.startsWith('sqlite_')).length).to.equal(6)
    } catch (err) {
      expect(err).to.not.exist()
    }
  })

  test('plugin throws error when no models are found', { parallel: true }, async () => {
    const server = new Hapi.Server()

    try {
      await server.register(Object.assign(HapiSequelize, {
        options: [
          {
            name: 'foo',
            database: {
              dialect: 'sqlite',
              name: 'database_' + process.env.NODE_ENV + '.sqlite',
            },
            models: ['./foo/**/*.js'],
            sync: true,
            forceSync: true,
          },
        ],
      }))
    } catch (err) {
      expect(err).to.exist()
    }
  })
})
