describe("Clear extensions in the browser", function() {

    it("Should be able to use execute binding to keep things awake", function() {

        var counter = 0;
        var x = ko.observable(0);
        var pc = ko.pureComputed(function() {
            x();
            counter++;
        });

        expect(counter).toEqual(0);

        var elem = document.createElement("DIV");
        elem.innerHTML = "<!-- ko execute: sideEffects --><!-- /ko -->";        
        ko.applyBindings({ sideEffects: [[{ blah: [pc]}]] }, elem);

        expect(counter).toEqual(1);
        x(1);
        expect(counter).toEqual(2);

        ko.cleanNode(elem);
        x(0);
        expect(counter).toEqual(2);
    });

});
