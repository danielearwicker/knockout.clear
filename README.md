# knockout.clear
*Minimal utilities to make it easy to get KnockoutJS to clear up garbage automatically*

## Motivation

* [Introductory blog post](https://smellegantcode.wordpress.com/2015/02/21/knockout-clear-fully-automatic-cleanup-in-knockoutjs-3-3/)
* [Initial discussion](https://groups.google.com/d/msg/knockoutjs/uYCyGs2hb2k/Y_5sd9rLRXcJ)

In brief, with the introduction of `ko.pureComputed` it should not be necessary to manually dispose of anything in Knockout:

* Only use `ko.pureComputed` and when your observables are not subscribed to, they will not subscribe to anything else and so will not be kept alive unnecessarily.
* Well-behaved bindings will call `ko.cleanNode` on DOM elements before they are discarded, which will make them unsubscribe from your observables.

The only hitch is the need to trigger side-effects that don't return values. A `pureComputed` won't do this unless it is `awake`, and to be awake it needs to be subscribed to.

One major application of side-effects is the need to make asynchronously-obtained values (such as promises) appear like ordinary observables.

This library defines the building blocks for dealing with side-effects within the framework of `pureComputed`, and builds on the resulting pattern to provide an easy way to consume promises.

## Usage

All you need is:

* [Knockout 3.3](http://knockoutjs.com) or later
* The single file  [lib/knockout.clear.js](https://github.com/danielearwicker/knockout.clear/blob/master/lib/knockout.clear.js) from the knockout.clear repository.

The other stuff in the repository is mostly unit tests.

If you're into bower:

    bower install danielearwicker/knockout.clear

Note that this library assumes `ko` is a global so it can extend it. If there's a more flexible way to arrange it, I'm open to suggestions.

If you're into TypeScript (entirely optional), you'll also want:

* [typings/knockout.clear/knockout.clear.d.ts](https://github.com/danielearwicker/knockout.clear/blob/master/typings/knockout.clear/knockout.clear.d.ts)

## The `execute` binding

The `execute` binding is useful when you want to create a `ko.pureComputed` that acts as a side-effecting function that re-executes when its dependencies change, but doesn't return a value and would not normally be depended on by anything else.

To keep it awake, first you add it to your view model:

    var viewModel = {
        pointlessLogging: ko.pureComputed(function() {
            console.log("Phone number is: " + phoneNumber());
        })
    };

Then you bind to it in your HTML:

    <!-- ko execute: pointlessLogging --><!-- /ko -->

That's it. When you have a simple viewModel/HTML scenario, this is the easy way to keep your `pureComputed` re-executing as long as the view is on the page.

For more advanced situations, you might need the API.

## API

*Note: The TypeScript declarations are presented here as a precise reference, but this library is not actually written in TypeScript and does not depend on it. Code samples are both valid JavaScript and TypeScript.*

---

### `ko.execute`

    execute(pureComputed: KnockoutComputed<any>,
            evaluatorFunction: () => void,
            thisObj?: any): KnockoutExecuteExtendable;

`ko.execute` is used as an alternative to the `execute` binding described above, in situations where you can't (or don't want to) simply modify the HTML bindings.

This is typically in situations where you're building a reusable fragment of a model containing observable data, but you don't want to force your users to use the `execute` binding. See `ko.unpromise` in this library for an example.

To control when the `evaluatorFunction` should be actively re-executing, you must supply a `pureComputed` as the first argument (an `Error` is thrown otherwise).

The `evaluatorFunction` should return `void`, and must not depend on the `pureComputed` that you supplied as the first argument (an `Error` is thrown otherwise).

    ko.execute(lastName, function() {
        console.log("Phone number is: " + phoneNumber());
    });

The returned object only has an `extend` function, so you can apply extenders it. Otherwise, you don't need to keep a reference to it and you don't need to manually dispose it.

---

### `ko.unpromise`

    unpromise<T>(evaluatorFunction: () => T | KnockoutExecuteThenable<T>,
                 options?: {
                     initialValue?: T;
                     errorValue?: T;
                     thisArg?: any;
                 }): KnockoutComputed<T>;

`ko.unpromise` creates a `pureComputed` that automatically converts promises (or indeed anything vaguely promise-like) into plain values.

The `evaluatorFunction` will likely depend on other observables which act as parameters to some API that returns a promise, e.g. using jQuery if you like:

    var text = ko.unpromise(function() {
        return $.get('page/' + selectedPageName());
    });

The value of `text` will initially be `undefined`, but a short time later the asynchronous `$.get` will complete and `text` will change its value to the returned data. It acts just like any other `pureComputed` so you can bind to it or read it from other `pureComputed`s.

You can change the default values by passing options:

    var text = ko.unpromise(function() {
        return $.get("messages/" + selectedMessage());
    }, {
        initialValue: "Please wait...",
        errorValue: "Message could not be loaded"
    });

If `errorValue` is not specified, `initialValue` is used.

---

### `ko.isPureComputed`

    isPureComputed(obs: any): boolean;

Returns true if the argument was created with `ko.pureComputed`.

Note: It is possible to create a `pureComputed` by calling `ko.computed` and passing `pure: true`, but this function cannot detect that. Consequently you cannot use such objects as the the first argument to `ko.execute`.

There is a plausible excuse for this: strive to only use `ko.pureComputed`, so that you can easily search your code for any remaining uses of `ko.computed` and regard them as suspicious.

## Running the tests

Install node and grunt-cli. Clone this repository and install it:

    git clone http://github.com/danielearwicker/knockout.clear.git
    cd knockout.clear
    npm install

That will run the command-line tests. There is a further minor test for the `execute` binding that you can run by opening the runner page in your browser:

    spec/runner.html

Note that all the Knockout 3.3 tests will also run! This is important because `knockout.clear` patches and wraps a couple of things (see the source for details).
