describe("Clear extensions", function() {

    var nothing = function() {};

    it("Should be able to detect pureComputed vs other", function() {
        expect(ko.isPureComputed(0)).toEqual(false);
        expect(ko.isPureComputed(ko.observable())).toEqual(false);
        expect(ko.isPureComputed(ko.computed(nothing))).toEqual(false);
        expect(ko.isPureComputed(ko.pureComputed(nothing))).toEqual(true);
    });

    it("Should be able to create working orphans with ko.execute", function() {

        var x = ko.observable(0);
        var px = ko.pureComputed(x);

        var counter = 0;
        ko.execute(px, function() {
            x(); // depend on
            counter++; // show we've executed
        });
        // Not awake initially
        expect(counter).toEqual(0);

        var sub = px.subscribe(nothing);
        expect(counter).toEqual(1);

        x(1);
        expect(counter).toEqual(2);

        sub.dispose();
        expect(counter).toEqual(2);
        expect(x.getSubscriptionsCount()).toEqual(0);

        // Awaken: doesn't execute, but does subscribe
        sub = px.subscribe(nothing);
        expect(counter).toEqual(2);
        expect(x.getSubscriptionsCount()).toEqual(2);   // from both computeds
    });

    it("Should cope with pureComputed initially awake in ko.execute", function() {

        var x = ko.observable(0);
        var px = ko.pureComputed(x);

        // Wake up px
        var sub = px.subscribe(nothing);

        var counter = 0;
        ko.execute(px, function() {
            x(); // depend on
            counter++; // show we've executed
        });

        // Should have already woken
        expect(counter).toEqual(1);

        x(1);
        expect(counter).toEqual(2);

        sub.dispose();
        expect(counter).toEqual(2);
    });

    it("Should refuse non-pureComputed first argument in ko.execute", function() {

        var caught;
        try {
            ko.execute(0, nothing);
        } catch (x) {
            caught = x;
        }
        expect(caught && caught.message).toMatch(/ko\.pureComputed/);
    });

/*	Unfortunately I haven't yet found a way to do this check reliably...

    it("Should refuse pureComputed circularity in ko.execute", function() {

        var x = ko.observable(0);
        var px = ko.pureComputed(x);

        px.subscribe(nothing);

        var caught;
        try {
            ko.execute(px, function() {
                px(); // depend on
            });
        } catch (x) {
            caught = x;
        }
        expect(caught && caught.message).toMatch(/dependency/);
    });
*/

    it("Should support extenders like throttle", function() {

        var x = ko.observable(0);
        var px = ko.pureComputed(x);

        var counter = 0;
        ko.execute(px, function() {
            x(); // depend on
            counter++; // show we've executed
        }).extend({ throttle: 5 });

        runs(function() {
            expect(counter).toEqual(0);
            px.subscribe(nothing);
            // First run is immediate
            expect(counter).toEqual(1);
        });

        waits(100);
        runs(function() {
            x(1);
            // Throttle should stop immediate execution
            expect(counter).toEqual(1);
        });

        waits(100);
        runs(function() {
            expect(counter).toEqual(2);
        });
    });

    var mockThenable = function(timeout, val, err) {
        return {
            then: function(resolve, reject) {
                setTimeout(function() {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(val);
                    }
                }, timeout);
            }
        };
    }

    it("Should unwrap thenables with ko.unpromise", function() {

        var message = ko.observable("hi"),
            error = ko.observable();

        var v = ko.unpromise(function() {
            return mockThenable(10, message(), error());
        });
        waits(100);

        var sub;
        runs(function() {
            // Nothing is observing v yet so it is asleep and has initialValue
            expect(v.peek()).toEqual(void 0);
            // wake it up
            sub = v.subscribe(nothing);
            // Answer will not be immediate
            expect(v.peek()).toEqual(void 0);
        });

        waits(100);

        runs(function() {
            expect(v.peek()).toEqual("hi");
            message("bye");
            expect(v.peek()).toEqual("hi");
        });

        waits(100);

        runs(function() {
            expect(v.peek()).toEqual("bye");
            error(new Error("blah"));
            expect(v.peek()).toEqual("bye");
        });

        waits(100);

        runs(function() {
            // should revert to error value
            expect(v.peek()).toEqual(void 0);
            // go to sleep
            sub.dispose();
            message("hi again");
        });

        waits(100);

        runs(function() {
            // expect no change because no longer awake
            expect(v.peek()).toEqual(void 0);
        });
    });

    it("Should accept options to ko.unpromise", function() {

        var message = ko.observable("hi"),
            error = ko.observable();

        var v = ko.unpromise(function() {
            return mockThenable(10, message(), error());
        }, {
            initialValue: "nothing",
            errorValue: "badness"
        });
        waits(100);

        var sub;
        runs(function() {
            // Nothing is observing v yet so it is asleep and has initialValue
            expect(v.peek()).toEqual("nothing");
            // wake it up
            sub = v.subscribe(nothing);
            // Answer will not be immediate
            expect(v.peek()).toEqual("nothing");
        });

        waits(100);

        runs(function() {
            expect(v.peek()).toEqual("hi");
            message("bye");
            expect(v.peek()).toEqual("hi");
        });

        waits(100);

        runs(function() {
            expect(v.peek()).toEqual("bye");
            error(new Error("blah"));
            expect(v.peek()).toEqual("bye");
        });

        waits(100);

        runs(function() {
            // should revert to error value
            expect(v.peek()).toEqual("badness");
            // go to sleep
            sub.dispose();
            message("hi again");
        });

        waits(100);

        runs(function() {
            // expect no change because no longer awake
            expect(v.peek()).toEqual("badness");
        });
    });
});
