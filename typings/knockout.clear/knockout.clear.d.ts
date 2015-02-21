///<reference path="../knockout/knockout.d.ts" />

interface KnockoutExecuteExtendable {
    extend(requestedExtenders: { [key: string]: any; }): KnockoutExecuteExtendable;
}

interface KnockoutExecuteThenable<T> {
    then(done: (result: T) => void): any;
}

interface KnockoutStatic {
    isPureComputed(obs: any): boolean;

    execute(
        pureComputed: KnockoutComputed<any>,
        evaluatorFunction: () => void,
        thisObj?: any): KnockoutExecuteExtendable;

    unpromise<T>(
        evaluatorFunction: () => T | KnockoutExecuteThenable<T>,
        options?: {
            initialValue?: T;
            errorValue?: T;
            thisArg?: any;
        }): KnockoutComputed<T>;
}
