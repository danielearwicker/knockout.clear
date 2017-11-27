(function() {

    if ((typeof ko === "undefined") ||
        (typeof ko.version !== "string") ||
        (parseFloat(ko.version.split("-")[0]) < 3.4)) {
        throw new Error("This library requires Knockout 3.4");
    }

    // Simple binding that we can use to keep a side-effecting pureComputed awake
    ko.bindingHandlers.execute = {
        init: function() {
            return { 'controlsDescendantBindings': true };
        },
        update: function(element, valueAccessor) {
            // Unwrap recursively - so binding can be to an array, etc.
            ko.toJS(valueAccessor());
        }
    };
    ko.virtualElements.allowedBindings.execute = true;
    // ko v3.4 adds native ko.isPureComputed
    if (!ko.isPureComputed){
        // Wrap ko.pureComputed to allow us to check if something was created by it
        var pureComputedId = "__execute_isPureComputed__";
        var originalPureComputed = ko.pureComputed.bind(ko);
        ko.pureComputed = function(evaluatorFunctionOrOptions, evaluatorFunctionTarget) {
            var pc = originalPureComputed(evaluatorFunctionOrOptions, evaluatorFunctionTarget);
            pc[pureComputedId] = true;
            return pc;
        };
        ko.isPureComputed = function(obs) {
            return !!(obs && obs[pureComputedId]);
        };
    }

    // Fix throttle so it returns pureComputed
    ko.extenders.throttle = function(target, timeout) {
        target['throttleEvaluation'] = timeout;
        var writeTimeoutInstance = null;
        return ko.pureComputed({
            'read': target,
            'write': function(value) {
                clearTimeout(writeTimeoutInstance);
                writeTimeoutInstance = setTimeout(function() {
                    target(value);
                }, timeout);
            }
        });
    };

    function ignore() {}

    // Creates a computed that is not designed to have a return value, just
    // side-effects. It must be given a pureComputed that keeps it awake.
    ko.execute = function(pureComputed, evaluator, thisObj) {

        if (!ko.isPureComputed(pureComputed)) {
            throw new Error("ko.execute must be passed a ko.pureComputed");
        }

        var internalComputed = ko.pureComputed(evaluator, thisObj);

        var disposable;
        function wake() {
            if (!disposable) {
                disposable = internalComputed.subscribe(ignore);
            }
        }

        // Should we start in the awake state?
        if (pureComputed.getSubscriptionsCount("change") !== 0) {
            wake();
        }

        pureComputed.subscribe(wake, null, "awake");
        pureComputed.subscribe(function() {
            if (disposable) {
                disposable.dispose();
                disposable = null;
            }
        }, null, "asleep");

        return internalComputed;
    }

    // ko.unpromise:
    //
    // Returns a pureComputed, using an evaluator function that may return
    //  a promise (or thenable). The promise is unwrapped and supplies the
    // value of the returned pureComputed.
    //
    // The second argument is optional, and may be an object containing any
    // of these optional properties:
    //
    //     initialValue - the value of the returned pureComputed prior to
    //                    promise being resolved
    //
    //     errorValue   - the value of the returned pureComputed if the
    //                    promise is rejected
    //
    //     thisArg      - the 'this' argument for the evaluator function
    //
    // If no errorValue is specified, initialValue is used instead. If no
    // initialValue is specified, undefined is used instead.
    ko.unpromise = function(evaluator, options) {
        var latest = ko.observable(options && options.initialValue),
            waitingOn = 0,
            result = ko.pureComputed(latest),
            errorValue = options && (options.errorValue || options.initialValue)

        ko.execute(result, function() {
            var p = evaluator.call(options && options.thisArg);
            var w = ++waitingOn;
            if (p && p.then) {
                p.then(function(v) {
                    if (w === waitingOn) {
                        latest(v);
                    }
                }, function() {
                    if (w === waitingOn) {
                        latest(errorValue);
                    }
                });
            } else {
                latest(p);
            }
        });
        return result;
    }
}());
