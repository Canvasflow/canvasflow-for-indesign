//@include "json2.js"
//@include "error.js"
//@include "Array.js"

var LogDialog = function(logFilePath) { 
    var $ = this;
    $.defaultDialogSize = [300,100];
    $.maxLines = 100;

    $.getLogsContent = function() {
        var lines = [];
        var logFile = new File(logFilePath);
        if(!logFile.exists) {
            return 'There are no logs';
        }

        logFile.open('r');
        do {
            lines.push(logFile.readln());
        } while(!logFile.eof);
        logFile.close();

        return lines.reverse().slice(undefined, $.maxLines).join('\n');
    }
    $.renderWindow = function(window) {
        // Log box
        // alert(logFilePath);
        window.boxGroup= window.add('group');
        window.boxGroup.orientation = 'row';
        window.boxGroup.box = window.boxGroup.add('edittext', [0, 0, 400, 400], $.getLogsContent(), {multiline: true,  readonly: true});

        // Panel buttons
        window.buttonsBarGroup = window.add('group', undefined, 'buttons');
        window.buttonsBarGroup.orientation = 'row';
        window.buttonsBarGroup.alignChildren = 'bottom';    
        window.buttonsBarGroup.closeBtn = window.buttonsBarGroup.add('button', undefined, 'Close');
        
        window.buttonsBarGroup.closeBtn.onClick = function() {
            window.close();
        }
        var logFile = new File(logFilePath);
        if(logFile.exists) {
            window.buttonsBarGroup.openBtn = window.buttonsBarGroup.add('button', undefined, 'Open');
            window.buttonsBarGroup.openBtn.onClick = function() {
                logFile.execute();
            }
        }
        window.show();
    }

    $.show = function() {
        try {
            var window = new Window('dialog', 'Logs');
            window.orientation = 'column';
            window.alignment = 'right';
            window.preferredSize = $.defaultDialogSize;
            $.renderWindow(window);
        } catch(e) {
            logError(e);
        }
    };
}