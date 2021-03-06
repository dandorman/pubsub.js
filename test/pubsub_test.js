require(['../pubsub/pubsub'], function(pubsub) {
  'use strict';

  var expect = chai.expect;

  var publish = pubsub.publish;
  var republish = pubsub.republish;
  var subscribe = pubsub.subscribe;
  var unsubscribe = pubsub.unsubscribe;
  var cancelSubscriptions = pubsub.cancelSubscriptions;

  describe("publish", function() {
    it("notifies subscribers when events are published", function(done) {
      var obj = {};
      var notified = false;

      subscribe(obj, 'foo', function() {
        notified = true;
      });

      publish.call(obj, 'foo');

      setTimeout(function() {
        expect(notified).to.be.true;
        done();
      }, 0);
    });

    it("passes additional arguments on to its callbacks", function(done) {
      var obj = {};
      var notified = false;

      subscribe(obj, 'foo', function(a, b, c) {
        expect(a).to.equal(1);
        expect(b).to.equal(2);
        expect(c).to.equal(3);
        done();
      });

      publish.call(obj, 'foo', 1, 2, 3);
    });
  });

  describe("subscribe", function() {
    it("adds the subscribed callbacks to the object's subscribers", function() {
      var obj = {};
      var subscriber = function() {};

      var subscription = subscribe(obj, 'foo', subscriber);

      expect(obj._subscribers['foo']).to.have.property(subscription.toString());
      expect(obj._subscribers['foo'][subscription]).to.equal(subscriber);
    });

    it("binds the callback to the calling object when called from an object that is not the global object", function(done) {
      var publisher = {};
      var subscriber = {};

      subscribe.call(subscriber, publisher, 'foo', function() {
        expect(this).to.equal(subscriber);
        done();
      });

      publish.call(publisher, 'foo');
    });

    describe("subscriptions", function() {
      it("returns an integer representing the subscription", function() {
        var subscription = subscribe({}, 'foo', function() {});

        expect(subscription).to.be.a('number');
      });

      it("is unique to each subscription", function() {
        var a_subscription = subscribe({}, 'foo', function() {});
        var another_subscription = subscribe({}, 'bar', function() {});

        expect(a_subscription).to.not.equal(another_subscription);
      });
    });

    it("replaces existing callbacks if a duplicate subscription is made", function(done) {
      var publisher = {};
      var subscriber = {};

      var flagOne = false;
      var flagTwo = false;

      subscribe.call(subscriber, publisher, 'foo', function() { flagOne = true });
      subscribe.call(subscriber, publisher, 'foo', function() { flagTwo = true });
      publish.call(publisher, 'foo');

      setTimeout(function() {
        expect(flagOne).to.be.false;
        expect(flagTwo).to.be.true;
        done();
      }, 0);
    });

  });

  describe("unsubscribe", function() {
    describe("when given a subscription key", function() {
      it("does not call the subscribed callback when notified", function(done) {
        var obj = {};
        var notified = false;

        var subscription = subscribe(obj, 'foo', function() { notified = true; });
        unsubscribe(subscription);

        publish.call(obj, 'foo');
        setTimeout(function() {
          expect(notified).to.be.false;
          done();
        }, 0);
      });

      it("is a no-op when called when given a non-existent key", function() {
        expect(function() { unsubscribe(-1) }).to.not.throw(ReferenceError);
      });
    });

    describe("when called from an object that is not the global object, and given an object and an event name", function() {
      it("unsubscribes the calling object from the target object's event", function(done) {
        var publisher = {};
        var subscriber = {};
        var notified = false;

        subscribe.call(subscriber, publisher, 'foo', function() { notified = true; });
        unsubscribe.call(subscriber, publisher, 'foo');

        publish.call(publisher, 'foo');
        setTimeout(function() {
          expect(notified).to.be.false;
          done();
        }, 0);
      });

      it("is a no-op when called when given a non-subscribed-to event", function() {
        expect(function() { unsubscribe.call({}, {}, 'foo') }).to.not.throw(ReferenceError);
      });
    });
  });

  describe("republish", function() {
    it("subscribes to the publisher's event, and publishes the same event to its own subscribers", function(done) {
      var publisher = {};
      var republisher = {};
      var subscriber = {};

      republish.call(republisher, publisher, 'foo');
      subscribe.call(subscriber, republisher, 'foo', function() { done() });

      publish.call(publisher, 'foo');
    });

    it("passes additional arguments along to proxy subscribers", function(done) {
      var publisher = {};
      var republisher = {};
      var subscriber = {};

      republish.call(republisher, publisher, 'foo');
      subscribe.call(subscriber, republisher, 'foo', function(a) {
        expect(a).to.equal('bar');
        done();
      });

      publish.call(publisher, 'foo', 'bar');
    });
  });

  describe("cancelSubscriptions", function() {
    describe("with no arguments", function() {
      it("stops publishing any events to any of its current subscribers", function(done) {
        var publisher = {};

        var foo = true;
        subscribe(publisher, 'foo', function() { foo = false });

        var bar = true;
        subscribe(publisher, 'bar', function() { bar = false });

        cancelSubscriptions.call(publisher);

        publish.call(publisher, 'foo');
        publish.call(publisher, 'bar');

        setTimeout(function() {
          expect(foo).to.be.true;
          expect(bar).to.be.true;
          done();
        }, 0);
      });
    });

    describe("with a single string argument", function() {
      it("stops publishing that event to any callbacks currently subscribed to it", function(done) {
        var publisher = {};

        var foo = true;
        subscribe(publisher, 'foo', function() { foo = false });

        var bar = true;
        subscribe(publisher, 'bar', function() { bar = false });

        cancelSubscriptions.call(publisher, 'foo');

        publish.call(publisher, 'foo');
        publish.call(publisher, 'bar');

        setTimeout(function() {
          expect(foo).to.be.true;
          expect(bar).to.be.false;
          done();
        }, 0);
      });
    });
  });

  mocha.run();
});
