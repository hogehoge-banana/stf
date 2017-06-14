require('./device-booking.less')
var _ = require('lodash')

module.exports =
  function DeviceBookingServiceFactory($uibModal, $location, $window, $filter, gettext,
                                       calendarConfig, DeviceScheduleService, UserService) {
    var service = {}
    var curUser = UserService.currentUser
    var translate = $filter('translate')
    var MY_BOOK = translate(gettext('Reserved'))
    var OTHERS = translate(gettext('Other'))
    var ONEHOURE = 60 * 60 * 1000
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

        var newEvent = {
          id: event.schedule.id
        , serial: event.schedule.serial
        , start: newStart
        , end: newEnd
        }
        if (validate(newEvent)) {
          DeviceScheduleService.update(newEvent)

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
        DeviceScheduleService.remove({
          id: target.schedule.id
        , serial: target.schedule.serial
        })
      }

      $scope.addRecord = function(calendarDate) {
        var startDate = calendarDate.utc()
        var endTime = startDate + 30 * 60 * 1000
        var endDate = new Date(endTime)
        var newSchedule = {
          id: null,
          serial: device.serial,
          start: startDate,
          end: endDate,
        }
        if (validate(newSchedule)) {
          var newEvent = {
            schedule: newSchedule,
            title: 'new',
            startsAt: new Date(startDate),
            endsAt: new Date(endDate),
            draggable: false,
            resizable: false,
            color: COLOR_PENDING
          }
          $scope.events.push(newEvent)
          DeviceScheduleService.add(newSchedule)
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
          if (newSchedule.id !== schedule.id &&
              newSchedule.start < schedule.end &&
              schedule.start < newSchedule.end) {
            result = false
            return false
          }
          else {
            return true
          }
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
