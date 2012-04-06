(function() {
  'use strict';

  var subscriptions = {},
      subscription = -1;

  function publish(event) {
    if (this === window) return;

    if (!this._subscribers || !this._subscribers[event]) return;

    var args = Array.prototype.slice.call(arguments, 1);
    args.unshift(this);

    for (var s in this._subscribers[event]) {
      setTimeout((function(callback) {
        return function() {
          callback.apply(null, args);
        };
      })(this._subscribers[event][s]), 0);
    }
  }

  function subscribe(object, event, callback) {
    if (!object._subscribers) object._subscribers = {};
    if (!object._subscribers[event]) object._subscribers[event] = {};

    if (this && this !== window) {
      unsubscribe.call(this, object, event);
      callback = callback.bind(this);
    }
    callback._subscriber = this;

    subscription += 1;

    object._subscribers[event][subscription] = callback;

    subscriptions[subscription] = {
      object: object,
      event: event,
      subscriber: this
    };

    return subscription;
  }

  function unsubscribe(s) {
    if (this && this !== window) {
      var publisher = arguments[0];
      var event = arguments[1];
      var pub_callbacks = publisher._subscribers[event];
      for (var idx in pub_callbacks) {
        if (pub_callbacks[idx]._subscriber == this) {
          delete publisher._subscribers[event][idx];
          delete subscriptions[idx];
          return;
        }
      }
    } else {
      if (s in subscriptions) {
        delete subscriptions[s].object._subscribers[subscriptions[s].event][s];
        delete subscriptions[s];
      }
    }
  }

  define([], {
    publish: publish,
    subscribe: subscribe,
    unsubscribe: unsubscribe
  });
})();
