var os = 'unix';
if(/^Win(.)*/gm.test($.os)) {
    os = 'dos';
}

alert(os);
