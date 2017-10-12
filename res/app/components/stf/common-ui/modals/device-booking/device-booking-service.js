require('./device-booking.less')
var _ = require('lodash')

var ONEHOURE = 60 * 60 * 1000
var END_TIME_OFFSET = 60 * 1000
var INITIAL_RESERVE_TIME = 30 * 60 * 1000

module.exports =
  function DeviceBookingServiceFactory($uibModal, $location, $window, $filter, gettext,
                                       calendarConfig, DeviceScheduleService, UserService) {
    var service = {}
    var curUser = UserService.currentUser
    var translate = $filter('translate')
    var MY_BOOK = translate(gettext('Reserved'))
    var OTHERS = translate(gettext('Other'))
    var COLOR_PENDING = calendarConfig.colorTypes.important

    var ModalInstanceCtrl = function($scope, $uibModalInstance, device) {
      $scope.device = device
      $scope.events = []
      $scope.targetDate = new Date()
      $scope.newrecord = null
      $scope.selected = null
      $scope.datepicker = {
        minDate: new Date()
      , opened: false
      }

      // modal controll
      $scope.ok = function() {
        $uibModalInstance.close(true)
      }

      $scope.cancel = function() {
        $uibModalInstance.dismiss('cancel')
      }

      // schedule booking

      $scope.eventEdited = function(event, newStart, newEnd) {
        $scope.selected = null
        var startTime = newStart.valueOf()
        var endTime = newEnd.valueOf()

        var newSchedule = {
          id: event.schedule.id
        , serial: event.schedule.serial
        , start: startTime
        , end: endTime
        }
        if (validate(newSchedule)) {
          DeviceScheduleService.update(device.serial, event.schedule.id, startTime, endTime)
          event.startsAt = newStart
          event.endsAt = newEnd
          event.draggable = false
          event.resizable = false
          event.color = COLOR_PENDING
        }
      }

      $scope.deleteEvent = function() {
        var target = $scope.selected
        $scope.selected = null
        _.remove($scope.events, function(event) {
          return event.schedule.id === target.schedule.id
        })
        DeviceScheduleService.remove(target.schedule.serial, target.schedule.id)
      }

      $scope.addRecord = function(calendarDate) {
        var newSchedule = makeInitialSchedule(calendarDate)
        if (validate(newSchedule)) {
          var newEvent = makeEvent(newSchedule)
          newEvent.title = 'new'
          newEvent.draggable = false
          newEvent.resizable = false
          newEvent.color = COLOR_PENDING

          $scope.events.push(newEvent)
          DeviceScheduleService.add(device.serial, newSchedule.start, newSchedule.end)
        }
      }

      $scope.eventClick = function(clickedEvent) {
        if (clickedEvent) {
          $scope.selected = clickedEvent
        }
      }

      // date control
      $scope.$watch('targetDate', function() {
        $scope.selected = null
        loadEvents()
      })

      // utility

      function makeInitialSchedule(selectedMoment) {
        var startTime = selectedMoment.valueOf()
        var endTime = startTime + INITIAL_RESERVE_TIME - END_TIME_OFFSET
        return {
          id: null
        , email: curUser.email
        , serial: device.serial
        , start: startTime
        , end: endTime
        }
      }

      function makeEvent(schedule) {
        var own = curUser.email === schedule.email
        return {
          schedule: schedule,
          title: (own ? MY_BOOK : OTHERS) + '&nbsp;&#128270;',
          startsAt: new Date(schedule.start),
          endsAt: new Date(schedule.end),
          color: own ? calendarConfig.colorTypes.success :
             calendarConfig.colorTypes.warning,
          actions: [],
          draggable: own,
          resizable: own,
          cssClass: 'a-css-class-name',
          own: own
        }
      }
      function loadEvents() {
        DeviceScheduleService.load(device.serial, $scope.targetDate)
          .then(function(schedules) {
            $scope.events = []
            _.forEach(schedules, function(schedule) {
              $scope.events.push(makeEvent(schedule))
            })
          })
      }

      function validate(newSchedule) {
        var diff = newSchedule.start - Date.now()
        if (diff < ONEHOURE) {
          return false
        }
        var result = true
        _.forEach($scope.events, function(event) {
          var schedule = event.schedule
          if (newSchedule.start <= schedule.end &&
              schedule.start <= newSchedule.end) {
            if (!schedule.id || newSchedule.id !== schedule.id) {
              result = false
              return false
            }
          }
          return true
        })
        return result
      }

      $scope.$on('deviceSchedule.updated', function(event, message) {
        if (message.data.serial === device.serial) {
          loadEvents()
        }
      })

      // initialize
      loadEvents()
    }

    service.open = function(device) {
      var modalInstance = $uibModal.open({
        size: 'lg',
        template: require('./device-booking.pug'),
        controller: ModalInstanceCtrl,
        backdrop: 'static',
        resolve: {
          device: function() {
            return device
          }
        }
      })

      return modalInstance.result
    }

    return service
  }
