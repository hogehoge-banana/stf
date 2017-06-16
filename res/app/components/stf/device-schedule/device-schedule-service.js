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
      , cache: false
    })
    .then(function(response) {
      return response.data.schedules
    })
  }

  deviceScheduleService.add = function(serial, start, end) {
    var reqUrl = '/api/v1/schedules/' + serial

    return $http.post(reqUrl, {
        start: start
      , end: end
    })
    .then(function(response) {
      return response.data
    })
  }

  deviceScheduleService.update = function(serial, id, start, end) {
    var reqUrl = '/api/v1/schedules/' + serial + '/' + id
    return $http.put(reqUrl, {
      start: start, end: end
    })
    .then(function(response) {
      return response.data
    })
  }

  deviceScheduleService.remove = function(serial, id) {
    var reqUrl = '/api/v1/schedules/' + serial + '/' + id
    return $http.delete(reqUrl)
      .then(function(response) {
        return response.data
      })
  }

  socket.on('deviceSchedule.updated', function(message) {
    $rootScope.$broadcast('deviceSchedule.updated', message)
    $rootScope.$apply()
  })

  return deviceScheduleService
}
