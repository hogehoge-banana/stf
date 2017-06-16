var _ = require('lodash')
var Promise = require('bluebird')

var dbapi = require('../../../db/api')
var logger = require('../../../util/logger')

var log = logger.createLogger('api:controllers:schedule')

function getSchedulesBySerial(req, res) {
  var serial = req.swagger.params.serial.value
  var start = req.swagger.params.start.value
  var end = req.swagger.params.end.value

  dbapi.loadSchedule(serial, start, end)
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

function addSchedule(req, res) {
  var serial = req.swagger.params.serial.value
  var schedule = req.swagger.params.schedule.value
  var start = schedule.start
  var end = schedule.end

  dbapi.insertSchedule(serial, req.user.email, start, end)
    .then(function(cursor) {
      log.debug(`generated: ${cursor.generated_keys[0]}`)
      res.status(201).json({
          success: true
      })
    })
    .catch(err => {
      log.error('Failed to load device list: ', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function updateSchedule(req, res) {
  var id = req.swagger.params.id.value
  var schedule = req.swagger.params.schedule.value
  var start = schedule.start
  var end = schedule.end
  dbapi.updateSchedule(id, start, end)
    .then(function() {
      res.status(201).json({
          success: true
      })
    })
    .catch(err => {
      log.error('Failed to load device list: ', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function deleteSchedule(req, res) {
  // todo: collect serial and id and email. (to check target data is exactly own data)
  //var serial = req.swagger.params.serial.value
  var id = req.swagger.params.id.value

  dbapi.removeSchedule(id)
    .then(function() {
      res.status(204).json({
          success: true
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
, addSchedule: addSchedule
, updateSchedule: updateSchedule
, deleteSchedule: deleteSchedule
}
