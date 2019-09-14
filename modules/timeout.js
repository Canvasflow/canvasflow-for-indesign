setTimeout = function(func, time) {
    $.sleep(time);
    func();
};