var CanvasflowAbout = function(version) {
    var $ = this;
    $.version = version;

    $.show = function() {
        var dialog = new Window('dialog', 'Canvasflow');
        dialog.orientation = 'column';
        dialog.alignment = 'right';
        dialog.preferredSize = [300,100];
        var labelWidth = 100;
        var valueWidth = 200;

        var title = dialog.add('statictext', undefined,'InDesign to Canvasflow');
        title.alignment = 'left';

        var fields = [
            {
                label: 'Version',
                value: $.version
            },
            {
                label: 'Install path',
                value: getBasePath()
            },
            {
                label: 'Support',
                value: 'support@canvasflow.io'
            },
            {
                label: 'Website',
                value: 'https://canvasflow.io'
            }
        ];
        
        for(var i=0; i < fields.length; i++) {
            var field = fields[i];
            var group = dialog.add('group');
            group.orientation = 'row';
            
            group.add('statictext', [0, 0, labelWidth, 20], field.label);
            group.add('statictext', [0, 0, valueWidth, 20], field.value);
        }
        dialog.add('statictext', [0, 0, labelWidth, 0], '');
        var copyright = dialog.add('statictext', undefined,'\u00A9 2015-2019 Canvasflow Ltd');
        copyright.alignment = 'left';

        dialog.buttonsBarGroup = dialog.add('group', undefined, 'buttons');
        dialog.buttonsBarGroup.closeBtn = dialog.add('button', undefined, 'Close');
        dialog.buttonsBarGroup.closeBtn.alignment = 'bottom';
        dialog.buttonsBarGroup.closeBtn.onClick = function () {
            dialog.close();
        }
        dialog.show();
    }
}