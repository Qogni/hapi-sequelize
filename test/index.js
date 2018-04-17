'use strict'

const Lab = require('lab')
const Code = require('code')
const Sinon = require('sinon')
const Hapi = require('hapi')
const Sequelize = require('sequelize')
const HapiSequelize = require('../lib')

const lab = exports.lab = Lab.script()
const test = lab.test
const expect = Code.expect

const connectionString = 'sqlite://database_' + process.env.NODE_ENV + '.sqlite'

lab.suite('hapi-sequelize', () => {
  test('plugin works', { parallel: true }, async () => {
    const server = new Hapi.Server()

    const sequelize = new Sequelize(connectionString)

    const onConnect = (database) => {
      server.log('onConnect called')
    }

    const spy = Sinon.spy(onConnect)

    try {
      await server.register(Object.assign(HapiSequelize, {
        options: [
          {
            name: 'shop',
            models: ['./test/models/**/*.js'],
            sequelize: sequelize,
            sync: true,
            forceSync: true,
            onConnect: spy,
          },
        ],
      }))

      expect(server.plugins['hapi-sequelize']['shop'].sequelize).to.be.an.instanceOf(Sequelize)
      expect(spy.getCall(0).args[0]).to.be.an.instanceOf(Sequelize)

      let tables = await server.plugins['hapi-sequelize']['shop'].sequelize.query('SELECT name FROM sqlite_master WHERE type=\'table\'', { type: Sequelize.QueryTypes.SELECT })
      expect(tables.filter(table => !table.startsWith('sqlite_')).length).to.equal(6)
    } catch (err) {
      expect(err).to.not.exist()
    }
  })

  test('plugin throws error when no models are found', { parallel: true }, async () => {
    const server = new Hapi.Server()

    const sequelize = new Sequelize(connectionString)

    try {
      await server.register(Object.assign(HapiSequelize, {
        options: [
          {
            name: 'foo',
            models: ['./foo/**/*.js'],
            sequelize: sequelize,
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
