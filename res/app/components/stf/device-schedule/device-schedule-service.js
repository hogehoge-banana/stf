module.exports = function DeviceScheduleServiceFactory($q, $http, $rootScope, socket) {
  var deviceScheduleService = {}


  function getDate(y, m, d) {
    return new Date(y, m, d, 0, 0, 0)
  }
  function getTargetDate(targetDate) {
    return getDate(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
  }
  function getNextDate(targetDate) {
    var day = targetDate.getDate() + 1
    return getDate(targetDate.getFullYear(), targetDate.getMonth(), day)
  }

  deviceScheduleService.load = function(serial, date) {
    var from = getTargetDate(date)
    var to = getNextDate(date)
    var reqUrl = '/api/v1/schedules/' + serial

    return $http.get(reqUrl, {
      params: {
        start: from.getTime()
      , end: to.getTime()
      }
    })
    .then(function(response) {
      return response.data.schedules
    })
  }

  deviceScheduleService.add = function(data) {
    socket.emit('deviceSchedule.add', {
      serial: data.serial
    , start: data.start
    , end: data.end
    })
  }

  deviceScheduleService.update = function(data) {
    socket.emit('deviceSchedule.update', {
      id: data.id
    , serial: data.serial
    , start: data.start
    , end: data.end
    })
  }

  deviceScheduleService.remove = function(data) {
    socket.emit('deviceSchedule.remove', {
      id: data.id
    , serial: data.serial
    })
  }

  socket.on('deviceSchedule.updated', function(message) {
    $rootScope.$broadcast('deviceSchedule.updated', message)
    $rootScope.$apply()
  })

  return deviceScheduleService
}
