///<reference path="../lib/knockout.clear.d.ts" />
///<reference path="../node_modules/@types/knockout/index.d.ts" />

// Typically ko.execute uses a void evaluator
var pcv = ko.pureComputed(() => {});
var e1 = ko.execute(pcv, () => {});
e1.extend({ throttle: 500 });

// But can use one that returns a value
var pci = ko.pureComputed(() => 1);
var e2 = ko.execute(pci, () => 2);
e2.extend({ throttle: 500 });

var minimumThenable: KnockoutExecuteThenable<number> = {
    then(done: (result: number) => void) {
        done(3);
    }
}

var i1 = ko.unpromise(() => minimumThenable);
i1() === 3;

var i2 = ko.unpromise(() => minimumThenable, {
    initialValue: 4,
    errorValue: 5,
    thisArg: null
});
i1() === 3;
