module.exports = init

var Emitter = require('events').EventEmitter
  , sunCalc = require('suncalc')
  , Sunwatcher = require('sunwatcher')

function init(callback) {
  callback(null, 'time', Time)
}

function Time(automait, logger, config) {
  Emitter.call(this)
  this.automait = automait
  this.logger = logger
  this.config = config
  determineSunTimesForLocations.call(this, config)
  // run this one a day (TODO: Really needs to be start of day)
  setInterval(determineSunTimesForLocations.bind(this, config), 3600000)
}

Time.prototype = Object.create(Emitter.prototype)

Time.prototype.init = function () {
  setupSunEvents.call(this, this.config)
}

Time.prototype.isAfterSunset = function (locationName, callback) {
  if (!this.sunTimes[locationName]) return callback(new Error('Unknown location'))
  var now = new Date()
  callback(null, now > this.sunTimes[locationName].sunsetStart)
}

Time.prototype.isAfterSunrise = function (locationName, callback) {
  if (!this.sunTimes[locationName]) return callback(new Error('Unknown location'))
  var now = new Date()
  callback(null, now > this.sunTimes[locationName].sunrise)
}

Time.prototype.isBeforeSunrise = function (locationName, callback) {
  if (!this.sunTimes[locationName]) return callback(new Error('Unknown location'))
  var now = new Date()
  callback(null, now < this.sunTimes[locationName].sunriseEnd)
}

function determineSunTimesForLocations(config) {
  // THIS NEEDS TO BE RE-RUN EVERYDAY (AT THE START OF THE DAY)
  var sunTimes = {}
  config.locations.forEach(function (location) {
    var times = sunCalc.getTimes(new Date(), location.latitude, location.longitude);
    sunTimes[location.name] = times
  })
  this.sunTimes = sunTimes
}

function setupSunEvents(config) {
  config.locations.forEach(function (location) {
    var sunwatcher = new Sunwatcher(location.latitude, location.longitude)

    sunwatcher.on('sunrise', function() {
      this.emit('sunrise:location:' + location.name)
    }.bind(this))

    sunwatcher.on('sunset', function() {
      this.emit('sunset:location:' + location.name)
    }.bind(this))

    sunwatcher.startSunWatch()

  }.bind(this))
}
