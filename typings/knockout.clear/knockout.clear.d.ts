///<reference path="../knockout/knockout.d.ts" />

interface KnockoutExecuteThenable<T> {
    then(done: (result: T) => void): any;
}

interface KnockoutStatic {
    execute<T>(
        pureComputed: KnockoutComputed<any>,
        evaluatorFunction: () => T,
        thisObj?: any): KnockoutComputed<T>;

    unpromise<T>(
        evaluatorFunction: () => T | KnockoutExecuteThenable<T>,
        options?: {
            initialValue?: T;
            errorValue?: T;
            thisArg?: any;
        }): KnockoutComputed<T>;

    isPureComputed(obs: any): boolean;
}
