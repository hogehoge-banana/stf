var _ = require('lodash')
var Promise = require('bluebird')

var dbapi = require('../../../db/api')
var logger = require('../../../util/logger')

var log = logger.createLogger('api:controllers:schedule')

function getSchedulesBySerial(req, res) {
  var serial = req.swagger.params.serial.value
  var start = req.swagger.params.start.value
  var end = req.swagger.params.end.value
  log.debug(`seriall: ${serial} start: ${start} end ${end}`)

  dbapi.loadUserDevices(serial, start, end)
    .then(function(cursor) {
      return Promise.promisify(cursor.toArray, cursor)()
        .then(list => {
          res.json({
            success: true
          , schedules: list
          })
        })
    })
    .catch(err => {
      log.error('Failed to load device list: ', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

module.exports = {
  getSchedulesBySerial: getSchedulesBySerial
}
