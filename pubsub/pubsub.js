define([], function() {
  'use strict';

  var subscriptions = {},
      subscription = -1;

  function publish(event) {
    if (this === window) return;

    if (!this._subscribers || !this._subscribers[event]) return;

    var args = Array.prototype.slice.call(arguments, 1);

    for (var s in this._subscribers[event]) {
      setTimeout((function(callback) {
        return function() {
          callback.apply(null, args);
        };
      })(this._subscribers[event][s]), 0);
    }
  }

  function subscribe(publisher, event, callback) {
    if (!publisher._subscribers) publisher._subscribers = {};
    if (!publisher._subscribers[event]) publisher._subscribers[event] = {};

    if (this && this !== window) {
      unsubscribe.call(this, publisher, event);
      callback = callback.bind(this);
    }
    callback._subscriber = this;

    subscription += 1;

    publisher._subscribers[event][subscription] = callback;

    subscriptions[subscription] = {
      publisher: publisher,
      event: event,
      subscriber: this
    };

    return subscription;
  }

  function republish(publisher, event) {
    if (this === window) return;

    subscribe.call(this, publisher, event, (function(republisher) {
      return function() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(event);

        publish.apply(republisher, args);
      };
    }(this)));
  }

  function unsubscribe(publisherOrSubscription, event) {
    var callbacks, s;

    if (arguments.length == 2) {
      if (!this || this === window) return;

      var publisher = publisherOrSubscription;

      for (s in publisher._subscribers[event]) {
        if (publisher._subscribers[event][s]._subscriber === this) {
          callbacks = publisher._subscribers[event];
          break;
        }
      }
    } else {
      s = publisherOrSubscription;

      if (s in subscriptions) {
        callbacks = subscriptions[s].publisher._subscribers[subscriptions[s].event];
      }
    }

    if (callbacks) {
      delete callbacks[s];
      delete subscriptions[s];
    }
  }

  function cancelSubscriptions(event) {
    if (!this || this === window) return;

    if (!this._subscribers) return;

    var e, s;
    var empty = true;
    for (e in this._subscribers) {
      if (event === undefined || e === event) {
        for (s in this._subscribers[e]) {
          delete this._subscribers[e][s];
          delete subscriptions[s];
        }

        delete this._subscribers[e];
      } else if (event !== undefined) {
        empty = false;
      }
    }

    if (empty) delete this._subscribers;
  }

  return {
    publish: publish,
    republish: republish,
    subscribe: subscribe,
    unsubscribe: unsubscribe,
    cancelSubscriptions: cancelSubscriptions
  };
});
