var found = new Array (50);
var w = new Window ('palette', 'Building');
w.pbar = w.add ('progressbar', undefined, 0, found.length);
w.pbar.preferredSize.width = 300;
w.show();
for (var i = 0; i < found.length; i++){
w.pbar.value = w.pbar.value+1;
$.sleep(20); // Do something useful here
}

/*
var dialog = new Window('palette');
dialog.preferredSize = [300,100];

dialog.buttonsBarGroup = dialog.add('group', undefined, 'buttons');
dialog.buttonsBarGroup.orientation = 'row';
dialog.buttonsBarGroup.alignChildren = 'bottom'; 

// Add progress bar
dialog.progressBar = dialog.add('progessbar', undefined, 0, 100);
dialog.progressBar.preferredSize.width = 300;


dialog.buttonsBarGroup.cancelBtn = dialog.buttonsBarGroup.add('button', undefined, 'Cancel');
dialog.buttonsBarGroup.cancelBtn.onClick = function() {
    dialog.close(0);
}

var response = dialog.show();
if(!!response) {
    alert('I did not click cancel');
} else {
    alert('I click cancel');
}

for (var i = 0; i < 100; i++){
    dialog.progressBar.value = i+1;
    $.sleep(20); // Do something useful here
}*/