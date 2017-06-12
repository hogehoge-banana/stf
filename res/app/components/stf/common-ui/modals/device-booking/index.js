module.exports = angular.module('stf.device-booking', [
  require('mwl.calendar').name,
  require('stf/common-ui/modals/common').name,
  require('stf/device-schedule').name
])
  .factory('DeviceBookingService', require('./device-booking-service'))
