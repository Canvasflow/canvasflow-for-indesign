var CanvasflowAbout = function(version) {
    var $ = this;
    $.version = version;

    $.show = function() {
        var dialog = new Window('dialog', 'InDesign to Canvasflow');
        dialog.orientation = 'column';
        dialog.alignment = 'right';
        dialog.preferredSize = [300,100];
        var labelWidth = 100;
        var valueWidth = 200;

        var fields = [
            {
                label: 'Version',
                value: version
            },
            /*{
                label: 'Plugin help',
                value: 'Link',
                link: 'https://docs.canvasflow.io/article/245-using-the-indesign-plugin'
            },*/
            {
                label: 'Contact support',
                value: 'support@canvasflow.io'
            }
        ];
        
        for(var i=0; i < fields.length; i++) {
            var field = fields[i];
            var group = dialog.add('group');
            group.orientation = 'row';
            group.add('statictext', [0, 0, labelWidth, 20], field.label);
            if(!!field.link) {
                var hyperlinkBtn = group.add('button', [0, 0, valueWidth, 20]);
                hyperlinkBtn.text = 'Link'
                hyperlinkBtn.onClick = function() {
                    try {
                        dialog.select(hyperlinkBtn, SelectionOptions.REPLACE_WITH);
                        // app.select({texts: 'https://google.com'}, SelectionOptions.REPLACE_WITH);
                        app.copy();
                        alert('Link copy into the clipboard');
                    }catch(e) {
                        alert(e.message);
                    }
                   
                }
            } else {
                group.add('statictext', [0, 0, valueWidth, 20], field.value);
            }
        }
        var copyright = dialog.add('statictext', [0, 0, 300, 20], '© 2015-2019 Canvasflow Ltd');
        copyright.alignment = 'left';

        // system.callSystem("open " + "http://www.google.com");
        dialog.buttonsBarGroup = dialog.add('group', undefined, 'buttons');
        dialog.buttonsBarGroup.closeBtn = dialog.add('button', undefined, 'Close');
        dialog.buttonsBarGroup.closeBtn.alignment = 'bottom';
        dialog.buttonsBarGroup.closeBtn.onClick = function () {
            dialog.close();
        }
        dialog.show();
        // alert('Version: ' + version);
    }
}